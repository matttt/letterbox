"use client"
import { Game } from './game'
import Grow from '@mui/material/Grow';

export default function Home() {

  return (
    <main className="flex flex-col h-screen">
      <div className="grow"></div>
      <div className="flex">
        <div className="grow"></div>
        <Game />
        <div className="grow"></div>
      </div>
      <div className="grow"></div>
    </main>
  );
}
