// 音乐相关的纯函数:网易云解析(歌曲/歌单)、音频/嵌入分类。
// 不依赖数据库,方便单测。

export type Song = { title: string; artist: string; url: string };

/** 从网易云分享内容里提取歌曲 ID:
 *  支持 "https://music.163.com/song?id=1901371648" / "music.163.com/song/1901371648"
 *  或直接粘贴一串纯数字 ID */
export function parseNeteaseId(input: string): string | null {
  const text = input.trim();
  if (/^\d{6,}$/.test(text)) return text;
  const match = text.match(/song\?id=(\d+)/) ?? text.match(/song\/(\d+)/);
  return match ? match[1] : null;
}

/** 从网易云分享内容里提取歌单 ID:
 *  支持 "https://music.163.com/playlist?id=xxxx" / "music.163.com/#/playlist/xxxx" 或纯数字 */
export function parseNeteasePlaylistId(input: string): string | null {
  const text = input.trim();
  if (/^\d{6,}$/.test(text)) return text;
  const match = text.match(/playlist\?id=(\d+)/) ?? text.match(/playlist\/(\d+)/);
  return match ? match[1] : null;
}

export function isNeteaseSong(song: Song) {
  return song.url.startsWith("netease:");
}

export function neteaseSongEmbedUrl(songId: string) {
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=86`;
}

/** 网易云歌单外链播放器(官方):type=0 = 歌单,自带歌曲列表与歌词 */
export function neteasePlaylistEmbedUrl(playlistId: string) {
  return `https://music.163.com/outchain/player?type=0&id=${playlistId}&auto=0&height=430`;
}

/** 直接可播(<audio>)的歌曲:排除网易云嵌入型 */
export function directAudioSongs(playlist: Song[]) {
  return playlist.filter((song) => !isNeteaseSong(song));
}

export function neteaseSongs(playlist: Song[]) {
  return playlist.filter(isNeteaseSong);
}
