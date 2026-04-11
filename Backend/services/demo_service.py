from __future__ import annotations

import asyncio


class DemoService:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None

    def running(self) -> bool:
        return self._task is not None and not self._task.done()

    def stop(self) -> None:
        if self.running():
            self._task.cancel()

    def start(self, coro: asyncio.coroutines) -> None:
        self.stop()
        self._task = asyncio.create_task(coro)
