import { ANIME } from "@consumet/extensions";

// Changed Gogoanime to animekai from Consumet
const animekai = new ANIME.Animekai();

export async function getAnimekaiSources(id) {
    try {
        const data = await animekai.fetchEpisodeSources(id);

        if (!data) return null;

        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function getConsumetZoroSources(id, provider, episodeid, epnum, subtype) {
    try {
        let data;
        const API = process.env.ZORO_API;
        if (API) {
            const res = await fetch(`${API}/anime/episode-srcs?id=${episodeid}&server=vidstreaming&category=${subtype}`);
            data = await res.json();
        } else {
            console.log(episodeid)
            // Changed to Consumet Zoro with the new base URL
            const resp = await fetch(`https://api-consumet-idk.vercel.app/sources?providerId=${provider}&watchId=${encodeURIComponent(episodeid)}&episodeNumber=${epnum}&id=${id}&subType=${subtype}`);
            data = await resp.json();
        }
        if (!data) return null;

        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function getAnimeSources(id, provider, epid, epnum, subtype) {
    try {
        if (provider === "animekai") {
            const data = await getAnimekaiSources(epid);
            return data;
        }
        if (provider === "zoro") {
            const data = await getConsumetZoroSources(id, provider, epid, epnum, subtype)
            return data;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}
