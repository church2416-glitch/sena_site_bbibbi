import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loungeBaseUrl = "https://comm-api.game.naver.com/nng_main/v1/community/lounge/sena_rebirth/feed";
const boardIds = {
  notices: 11,
  devNotes: 3,
};
const boardLinks = {
  notices: "https://game.naver.com/lounge/sena_rebirth/board/11",
  devNotes: "https://game.naver.com/lounge/sena_rebirth/board/3",
};

app.use(express.static(__dirname));

async function fetchLoungeBoard(boardId) {
  const url = `${loungeBaseUrl}?boardId=${boardId}&buffFilteringYN=N&limit=10&offset=0&order=NEW`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: `https://m.game.naver.com/lounge/sena_rebirth/board/${boardId}`,
      Origin: "https://m.game.naver.com",
    },
  });

  if (!response.ok) {
    throw new Error(`Naver lounge API failed: ${response.status}`);
  }

  const data = await response.json();
  const feedList = findFeedList(data);

  if (!Array.isArray(feedList)) {
    console.dir(
      {
        message: "Unexpected lounge response shape",
        boardId,
        topLevelKeys: Object.keys(data || {}),
        contentKeys: data?.content ? Object.keys(data.content) : [],
        sample: JSON.stringify(data).slice(0, 500),
      },
      { depth: 2 },
    );
    throw new Error("Unexpected lounge response shape");
  }

  return feedList.map(normalizeFeedItem);
}

function normalizeFeedItem(item) {
  const feed = item?.feed || item;
  const feedLink = item?.feedLink || feed?.feedLink || {};
  const user = item?.user || feed?.user || {};

  return {
    id: feed?.feedId || feed?.id || item?.id || "",
    title: feed?.title || item?.title || "제목 없음",
    date: feed?.createdDate || feed?.createdAt || item?.createdDate || item?.createdAt || "",
    link: feedLink?.pc || feedLink?.mobile || feed?.url || feed?.link || item?.url || item?.link || "#",
    thumbnail: feed?.repImageUrl || feed?.thumbnailUrl || feed?.imageUrl || item?.thumbnail || "",
    writer: user?.nickname || user?.name || item?.writer || "세븐나이츠",
    views: item?.readCount || feed?.readCount || item?.views || 0,
  };
}

function findFeedList(data) {
  const directCandidates = [
    data?.content?.feedList,
    data?.content?.feeds,
    data?.content?.list,
    data?.content?.items,
    data?.feedList,
    data?.feeds,
    data?.list,
    data?.items,
    data?.result?.content?.feedList,
    data?.result?.feedList,
  ];
  const direct = directCandidates.find(Array.isArray);
  if (direct) return direct;

  return findFirstFeedArray(data);
}

function findFirstFeedArray(value) {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    const looksLikeFeedList = value.some((item) => item?.feed || item?.feedId || item?.title);
    return looksLikeFeedList ? value : null;
  }

  for (const child of Object.values(value)) {
    const found = findFirstFeedArray(child);
    if (found) return found;
  }

  return null;
}

app.get("/api/notices", async (req, res) => {
  try {
    res.json(await fetchLoungeBoard(boardIds.notices));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "공지 불러오기 실패" });
  }
});

app.get("/api/dev-notes", async (req, res) => {
  try {
    res.json(await fetchLoungeBoard(boardIds.devNotes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "개발자노트 불러오기 실패" });
  }
});

app.get("/api/feed-links", (req, res) => {
  res.json(boardLinks);
});

app.listen(port, () => {
  console.log(`server running: http://localhost:${port}`);
});
