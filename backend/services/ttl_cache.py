import asyncio
import time
from typing import Any, Awaitable, Callable, Optional


class AsyncTTLCache:
    """Simple in-memory async TTL cache with per-key request deduplication."""

    def __init__(self, ttl_seconds: int = 3600):
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}
        self._inflight: dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    def _is_fresh(self, key: str) -> bool:
        item = self._store.get(key)
        if not item:
            return False
        expires_at, _value = item
        return expires_at > time.time()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if not self._is_fresh(key):
                self._store.pop(key, None)
                return None
            return self._store[key][1]

    async def set(self, key: str, value: Any) -> None:
        async with self._lock:
            self._store[key] = (time.time() + self.ttl_seconds, value)

    async def get_or_set(self, key: str, factory: Callable[[], Awaitable[Any]]) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached

        leader = False
        async with self._lock:
            if self._is_fresh(key):
                return self._store[key][1]
            future = self._inflight.get(key)
            if future is None:
                future = asyncio.get_event_loop().create_future()
                self._inflight[key] = future
                leader = True

        if not leader:
            return await future

        try:
            value = await factory()
            await self.set(key, value)
            async with self._lock:
                inflight = self._inflight.pop(key, None)
                if inflight and not inflight.done():
                    inflight.set_result(value)
            return value
        except Exception as exc:
            async with self._lock:
                inflight = self._inflight.pop(key, None)
                if inflight and not inflight.done():
                    inflight.set_exception(exc)
            raise
