// 恋爱卡(参考站同款):两个头像 + ❤ + 在一起天数。
// 数据来源:站长在外观后台填写的对象信息/纪念日;没填就显示单身状态。
type Props = {
  enabled: boolean;
  partnerNickname: string | null;
  partnerAvatar: string | null;
  startDate: string | null;
  myAvatar: string;
};

export default function LoveCard({
  enabled,
  partnerNickname,
  partnerAvatar,
  startDate,
  myAvatar,
}: Props) {
  if (!enabled) return null;

  const hasPartner = !!partnerNickname;
  const days =
    startDate && !Number.isNaN(Date.parse(startDate))
      ? Math.max(0, Math.floor((Date.now() - Date.parse(startDate)) / 86_400_000))
      : null;

  const otherAvatar = partnerAvatar || "/images/avatar-default.svg";

  return (
    <section className="glass rounded-2xl p-5 text-center">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent-2" />
        我和{hasPartner ? partnerNickname : "TA"}在一起已经
      </h3>

      <div className="flex items-center justify-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={myAvatar}
          alt=""
          className="h-14 w-14 rounded-full border-2 border-pink-300/60 object-cover"
        />
        <span className="animate-pulse text-2xl text-pink-400">❤</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={otherAvatar}
          alt=""
          className={`h-14 w-14 rounded-full border-2 border-white/40 object-cover ${
            hasPartner ? "" : "opacity-40 grayscale"
          }`}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs">
        <span className="rounded-full bg-pink-500/20 px-2.5 py-0.5 text-pink-500">
          {hasPartner ? "恋爱中" : "单身"}
        </span>
        {days !== null && (
          <span className="opacity-60">在一起 {days} 天</span>
        )}
      </div>

      {!hasPartner && (
        <p className="mt-2 text-[10px] opacity-40">
          在外观后台填写对象昵称/头像/纪念日,这里会变成恋爱计时卡。
        </p>
      )}
    </section>
  );
}
