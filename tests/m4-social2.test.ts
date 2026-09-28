import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// 好友关系类型升级(铁哥们/恋爱)+ 天气代码映射 的功能测试
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { closeDb } = await import("../src/lib/db");
const friendsLib = await import("../src/lib/friends");
const usersLib = await import("../src/lib/users");
const weather = await import("../src/lib/weather");

const a1 = await usersLib.registerUser({ username: "rel-a", password: "123456" });
const a2 = await usersLib.registerUser({ username: "rel-b", password: "123456" });

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 句柄延迟,不影响结论
  }
});

describe("好友关系类型升级", () => {
  it("成为好友后可升级为铁哥们/恋爱,可恢复普通", async () => {
    await friendsLib.sendFriendRequest(a1.id, a2.id);
    const incoming = await friendsLib.listIncomingRequests(a2.id);
    await friendsLib.acceptRequest(incoming[0].friendshipId, a2.id);

    // 升级恋爱
    const loved = await friendsLib.setFriendType(
      incoming[0].friendshipId,
      "love",
      a1.id,
    );
    expect(loved!.type).toBe("love");
    const friends1 = await friendsLib.listFriends(a1.id);
    expect(friends1[0].type).toBe("love");

    // 升级铁哥们
    const best = await friendsLib.setFriendType(
      incoming[0].friendshipId,
      "best",
      a2.id,
    );
    expect(best!.type).toBe("best");

    // 恢复普通
    await friendsLib.setFriendType(incoming[0].friendshipId, "friend", a1.id);
    const normal = await friendsLib.listFriends(a2.id);
    expect(normal[0].type).toBe("friend");
  });

  it("非法类型被拒绝;非好友双方不能设置", async () => {
    const a3 = await usersLib.registerUser({
      username: "rel-c",
      password: "123456",
    });
    expect(await friendsLib.setFriendType(999, "best", a3.id)).toBeNull();
  });
});

describe("天气代码映射", () => {
  it("常见天气代码映射正确", () => {
    expect(weather.wmoText(0)).toBe("晴");
    expect(weather.wmoText(61)).toBe("小雨");
    expect(weather.wmoText(95)).toBe("雷雨");
    expect(weather.wmoEmoji(0)).toBe("☀️");
    expect(weather.wmoEmoji(61)).toBe("🌧️");
    expect(weather.wmoEmoji(95)).toBe("⛈️");
  });
});

describe("内置城市坐标表 lookupPlace", () => {
  it("常见城市直接命中,不依赖在线地理编码", () => {
    const beijing = weather.lookupPlace("北京");
    expect(beijing).not.toBeNull();
    expect(beijing!.latitude).toBeCloseTo(39.9, 0);
    expect(beijing!.longitude).toBeCloseTo(116.4, 0);
  });

  it("带行政后缀也能匹配(永修县 → 永修)", () => {
    const direct = weather.lookupPlace("永修");
    const withSuffix = weather.lookupPlace("永修县");
    expect(withSuffix).toEqual(direct);
    expect(withSuffix).not.toBeNull();
  });

  it("九江取的是江西那个,不是外省同名小地方", () => {
    // 在线地理编码搜"九江"会先返回 28.16/109.12 的外省同名地,
    // 表里写死坐标就是为了避免这种"认错地方"
    const jiujiang = weather.lookupPlace("九江");
    expect(jiujiang!.latitude).toBeGreaterThan(29);
    expect(jiujiang!.longitude).toBeGreaterThan(115);
  });

  it("表里没有的地名返回 null,交给在线接口处理", () => {
    expect(weather.lookupPlace("某个不存在的地名")).toBeNull();
  });

  it("首尾空格不影响匹配", () => {
    expect(weather.lookupPlace("  南京  ")).toEqual(weather.lookupPlace("南京"));
  });
});
