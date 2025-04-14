import { redis } from '@/lib/rediscache';
import { ANIME } from "@consumet/extensions";
import { AnimeInfoAnilist } from '@/lib/Anilistfunctions';
import { findSimilarTitles } from '@/lib/stringSimilarity';

// Changed Gogoanime to animekai from Consumet
const animekai = new ANIME.Animekai();

// Changed Zoro to Consumet Zoro with the new base URL
const consumetZoro = new ANIME.Zoro({ baseUrl: "https://api-consumet-idk.vercel.app" });

export async function getMappings(anilistId) {
    const data = await getInfo(anilistId);
    let animekais, zorores;
    if (!data) {
        return null;
    }
    animekais = await mapAnimekai(data?.title);
    zorores = await mapConsumetZoro(data?.title);
    return { animekai: animekais, zoro: zorores, id: data?.id, malId: data?.idMal, title: data?.title.romaji };
}

async function getInfo(id) {
    try {
        let cachedData;
        if (redis) {
            cachedData = await redis.get(`info:${id}`);
            if (!JSON.parse(cachedData) || JSON.parse(cachedData)?.length === 0) {
                await redis.del(`info:${id}`);
                cachedData = null;
            }
        }
        if (cachedData) {
            // console.log("using cached info")
            return JSON.parse(cachedData);
        } else {
            const data = await AnimeInfoAnilist(id);
            const cacheTime = data?.status === 'FINISHED' ? 60 * 60 * 24 * 45 : 60 * 60 * 3;
            if (redis && data !== null && data) {
                await redis.set(`info:${id}`, JSON.stringify(data), "EX", cacheTime);
            }
            return data;
        }
    } catch (error) {
        console.error("Error fetching info: ", error);
    }
}

async function mapAnimekai(title) {
    let eng = await animekai.search(title?.english || title?.userPreferred);
    let rom = await animekai.search(title?.romaji);
    let english_search = eng?.results || [];
    let romaji_search = rom?.results || [];
    // Combine both results and remove duplicates
    const combined = [...english_search, ...romaji_search];

    const uniqueResults = Array.from(new Set(combined.map(item => JSON.stringify(item))))
        .map(item => JSON.parse(item));

    const animekaimap = findSimilarTitles(title?.romaji || title?.english || title?.userPreferred, uniqueResults);
    const animekai = {};

    animekaimap?.forEach((obj) => {
        const title = obj.title;
        const id = obj.id;

        const match = title.replace(/\(TV\)/g, "").match(/\(([^)0-9]+)\)/);

        if (match && (match[1].toLowerCase() === 'uncensored' || match[1].toLowerCase() === 'dub')) {
            const key = match[1].replace(/\s+/g, '-').toLowerCase();
            if (!animekai[key]) {
                animekai[key] = id;
            }
        } else {
            if (!animekai['sub']) {
                animekai['sub'] = id;
            }
        }
    });
    return animekai;
}

async function mapConsumetZoro(title) {
    let eng = await consumetZoro.search(title?.english || title?.romaji || title?.userPreferred);
    const zoromap = findSimilarTitles(title?.english, eng?.results);
    const zoromaprom = findSimilarTitles(title?.romaji, eng?.results);
    const combined = [...zoromap, ...zoromaprom];

    const uniqueCombined = combined.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    // Sort based on similarity (assuming similarity is a property of the objects)
    uniqueCombined.sort((a, b) => b.similarity - a.similarity);

    const zoro = {};

    uniqueCombined.forEach((obj) => {
        const title = obj.title;
        const id = obj.id;

        const match = title.replace(/\(TV\)/g, "").match(/\(([^)0-9]+)\)/);
        if (match && (match[1].toLowerCase() === 'uncensored' || match[1].toLowerCase() === 'dub')) {
            const key = match[1].replace(/\s+/g, '-').toLowerCase();
            if (!zoro[key]) {
                zoro[key] = id;
            }
        } else {
            if (!zoro['sub']) {
                zoro['sub'] = id;
            }
        }
    });
    return zoro;
}
