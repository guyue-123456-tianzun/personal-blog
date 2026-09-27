// 生成 30 秒氛围垫乐 WAV(Am-F-C-G 和弦进行,正弦叠加+包络),
// 作为播放器开箱即用的示例曲目 public/music/demo.wav。跑一次即可,不进构建。
import fs from "node:fs";

const sampleRate = 22050;
const duration = 30;
const totalSamples = sampleRate * duration;

// 四组和弦,每组 7.5 秒(Am → F → C → G)
const chords = [
  [220.0, 261.63, 329.63], // A3 C4 E4
  [174.61, 220.0, 261.63], // F3 A3 C4
  [130.81, 164.81, 196.0], // C3 E3 G3
  [196.0, 246.94, 293.66], // G3 B3 D4
];
const chordDuration = duration / chords.length;

const samples = new Int16Array(totalSamples);
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
  const chordTime = t - chordIndex * chordDuration;

  // 每组和弦:淡入 0.8s、淡出 1.2s,避免换和弦时"啪"一声
  let envelope = 1;
  if (chordTime < 0.8) envelope = chordTime / 0.8;
  if (chordTime > chordDuration - 1.2) {
    envelope = Math.min(envelope, (chordDuration - chordTime) / 1.2);
  }

  // 整体首尾淡入淡出
  const globalFade = Math.min(1, t / 2, (duration - t) / 2);

  let value = 0;
  chords[chordIndex].forEach((freq, noteIndex) => {
    const amplitude = 0.22 / (noteIndex + 1);
    // 轻微颤音让声音不那么"电子"
    const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 5 * t);
    value += amplitude * Math.sin(2 * Math.PI * freq * vibrato * t);
  });

  // 叠加八度下的低音,增加厚度
  const bass = chords[chordIndex][0] / 2;
  value += 0.1 * Math.sin(2 * Math.PI * bass * t);

  samples[i] = Math.round(
    Math.max(-1, Math.min(1, value * envelope * globalFade * 0.9)) * 32767,
  );
}

// 手写 WAV 头(PCM 16bit 单声道)
const dataSize = totalSamples * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // 单声道
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28); // 字节率
buffer.writeUInt16LE(2, 32); // 块对齐
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);
for (let i = 0; i < totalSamples; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

fs.mkdirSync("public/music", { recursive: true });
fs.writeFileSync("public/music/demo.wav", buffer);
console.log(`✅ demo.wav 已生成(${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
