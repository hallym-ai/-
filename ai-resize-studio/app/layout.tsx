import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "모양 · AI 리사이즈 스튜디오", description: "하나의 시안을 여섯 가지 크기로, 대화로 다듬는 리사이즈 작업실" };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
