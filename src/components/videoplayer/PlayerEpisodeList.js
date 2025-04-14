"use client";
import React, { useEffect, useState } from "react";
import styles from '../../styles/PlayerEpisodeList.module.css';
import { getEpisodes } from "@/actions/episode";
import { ProvidersMap } from "@/utils/EpisodeFunctions";
import { useRouter } from 'next-nprogress-bar';
import EpImgContent from "../Episodelists/EpImgContent";
import EpNumList from "../Episodelists/EpNumList";
import { Select, SelectItem, Tooltip } from "@nextui-org/react";
import Skeleton from "react-loading-skeleton";
import { useSubtype } from '@/lib/store';
import { useStore } from 'zustand';

function PlayerEpisodeList({ id, data, onprovider, setwatchepdata, epnum }) {
  const subtype = useStore(useSubtype, (state) => state.subtype);
  const router = useRouter();

  const [loading, setloading] = useState(true);
  const [providerChanged, setProviderChanged] = useState(false);
  const [refreshloading, setRefreshLoading] = useState(false);
  const [eplisttype, setEplistType] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredEp, setFilteredEp] = useState([]);
  const itemsPerPage = 35;

  const [defaultProvider, setdefaultProvider] = useState("");
  const [suboptions, setSuboptions] = useState(null);
  const [episodeData, setEpisodeData] = useState(null);
  const [dubcount, setDubcount] = useState(0);
  const [currentEpisodes, setCurrentEpisodes] = useState(null);

  useEffect(() => {
    const startIndex = (parseInt(currentPage) - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedep = currentEpisodes?.slice(startIndex, endIndex) || [];
    setFilteredEp(slicedep);
  }, [currentEpisodes, currentPage]);

  useEffect(() => {
    if (epnum) {
      const calculatedPage = Math.ceil(epnum / itemsPerPage);
      setCurrentPage(calculatedPage <= 0 ? 1 : calculatedPage);
    }
  }, [epnum]);

  useEffect(() => {
    const listtype = localStorage.getItem('eplisttype');
    if (listtype) {
      if (parseInt(listtype, 10) === 1) {
        setEplistType(2);
      } else {
        setEplistType(parseInt(listtype, 10));
      }
    }
  }, []);

  const handleOptionClick = (option) => {
    setEplistType(option);
    localStorage.setItem('eplisttype', option.toString());
  };

  useEffect(() => {
    const fetchepisodes = async () => {
      try {
        const response = await getEpisodes(id, data?.status === "RELEASING", false);
        setEpisodeData(response);
        if (response) {
          const { suboptions, dubLength } = ProvidersMap(response);
          setSuboptions(suboptions);
          setDubcount(dubLength);
        }
        setloading(false);
      } catch (error) {
        console.log(error);
        setloading(false);
      }
    };
    fetchepisodes();
  }, [id]);

  const handleProviderChange = (provider, subvalue = "sub") => {
    setdefaultProvider(provider);
    useSubtype.setState({ subtype: subvalue });
    setProviderChanged(true);
  };

  useEffect(() => {
    setdefaultProvider(onprovider);
    setProviderChanged(true);
  }, []);

  useEffect(() => {
    const provider = episodeData?.find((i) => i.providerId === defaultProvider);
    const filteredEp = provider?.consumet === true
      ? subtype === 'sub' ? provider?.episodes?.sub : provider?.episodes?.dub
      : subtype === 'dub'
        ? provider?.episodes?.slice(0, dubcount) : provider?.episodes;

    setwatchepdata(filteredEp);
    setCurrentEpisodes(filteredEp);
    if (filteredEp) {
      setProviderChanged(false);
    }
  }, [episodeData, subtype, defaultProvider]);

  useEffect(() => {
    if (!providerChanged && (currentEpisodes?.[epnum - 1]?.id || currentEpisodes?.[epnum - 1]?.episodeId)) {
      const episodeId = encodeURIComponent(currentEpisodes?.[epnum - 1]?.id || currentEpisodes?.[epnum - 1]?.episodeId);
      router.push(`/anime/watch?id=${id}&host=${defaultProvider}&epid=${episodeId}&ep=${epnum}&type=${subtype}`);
    }
  }, [providerChanged]);

  const refreshEpisodes = async () => {
    setRefreshLoading(true);
    try {
      const response = await getEpisodes(id, data.status === "RELEASING", true);
      setEpisodeData(response);
      if (response) {
        const { suboptions, dubLength } = ProvidersMap(response);
        setSuboptions(suboptions);
        setDubcount(dubLength);
      }
      setRefreshLoading(false);
    } catch (error) {
      console.error("Error refreshing episodes:", error);
      setRefreshLoading(false);
    }
  };

  const reversetoggle = () => {
    setCurrentPage(1);
    setCurrentEpisodes((prev) => [...prev].reverse());
  };

  return (
    <div className={styles.episodelist}>
      {loading ? (
        <>
          {[1].map((item) => (
            <Skeleton
              key={item}
              className="bg-[#18181b] flex w-full h-[100px] rounded-lg scale-100 transition-all duration-300 ease-out"
            />
          ))}
        </>
      ) : (
        <div className={styles.episodetop}>
          <div className={styles.episodetopleft}>
            <span className="text-xs lg:text-xs">You are Watching</span>
            <span className="font-bold text-sm md:text-white">Episode {epnum}</span>
            <span className="!leading-tight !text-[0.8rem] flex flex-col items-center justify-center text-center">
              If the current server doesn't work, please try other servers.
            </span>
          </div>
          <div className={styles.episodetopright}>
            {suboptions?.includes('sub') && (
              <div className={styles.episodesub}>
                <span className={styles.episodetypes}>
                  <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.6661 6.66699C4.29791 6.66699 3.99943 6.96547 3.99943 7.33366V24.667C3.99943 25.0352 4.29791 25.3337 4.6661 25.3337H27.3328C27.701 25.3337 27.9994 25.0352 27.9994 24.667V7.33366C27.9994 6.96547 27.701 6.66699 27.3328 6.66699H4.6661ZM8.66667 21.3333C8.29848 21.3333 8 21.0349 8 20.6667V11.3333C8 10.9651 8.29848 10.6667 8.66667 10.6667H14C14.3682 10.6667 14.6667 10.9651 14.6667 11.3333V12.6667C14.6667 13.0349 14.3682 13.3333 14 13.3333H10.8C10.7264 13.3333 10.6667 13.393 10.6667 13.4667V18.5333C10.6667 18.607 10.7264 18.6667 10.8 18.6667H14C14.3682 18.6667 14.6667 18.9651 14.6667 19.3333V20.6667C14.6667 21.0349 14.3682 21.3333 14 21.3333H8.66667ZM18 21.3333C17.6318 21.3333 17.3333 21.0349 17.3333 20.6667V11.3333C17.3333 10.9651 17.6318 10.6667 18 10.6667H23.3333C23.7015 10.6667 24 10.9651 24 11.3333V12.6667C24 13.0349 23.7015 13.3333 23.3333 13.3333H19.2C19.1264 13.3333 19.0667 13.393 19.0667 13.4667V18.5333C19.0667 18.607 19.1264 18.6667 19.2 18.6667H23.3333C23.7015 18.6667 24 18.9651 24 19.3333V20.6667C24 21.0349 23.7015 21.3333 23.3333 21.3333H18Z" fill="currentColor"></path>
                  </svg>
                  <span className="!font-medium ml-1">Sub</span>
                </span>
              </div>
            )}
            {suboptions?.includes('dub') && (
              <div className={styles.episodesub}>
                <span className={styles.episodetypes}>
                  <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.6661 6.66699C4.29791 6.66699 3.99943 6.96547 3.99943 7.33366V24.667C3.99943 25.0352 4.29791 25.3337 4.6661 25.3337H27.3328C27.701 25.3337 27.9994 25.0352 27.9994 24.667V7.33366C27.9994 6.96547 27.701 6.66699 27.3328 6.66699H4.6661ZM8.66667 21.3333C8.29848 21.3333 8 21.0349 8 20.6667V11.3333C8 10.9651 8.29848 10.6667 8.66667 10.6667H14C14.3682 10.6667 14.6667 10.9651 14.6667 11.3333V12.6667C14.6667 13.0349 14.3682 13.3333 14 13.3333H10.8C10.7264 13.3333 10.6667 13.393 10.6667 13.4667V18.5333C10.6667 18.607 10.7264 18.6667 10.8 18.6667H14C14.3682 18.6667 14.6667 18.9651 14.6667 19.3333V20.6667C14.6667 21.0349 14.3682 21.3333 14 21.3333H8.66667ZM18 21.3333C17.6318 21.3333 17.3333 21.0349 17.3333 20.6667V11.3333C17.3333 10.9651 17.6318 10.6667 18 10.6667H23.3333C23.7015 10.6667 24 10.9651 24 11.3333V12.6667C24 13.0349 23.7015 13.3333 23.3333 13.3333H19.2C19.1264 13.3333 19.0667 13.393 19.0667 13.4667V18.5333C19.0667 18.607 19.1264 18.6667 19.2 18.6667H23.3333C23.7015 18.6667 24 18.9651 24 19.3333V20.6667C24 21.0349 23.7015 21.3333 23.3333 21.3333H18Z" fill="currentColor"></path>
                  </svg>
                  <span className="!font-medium ml-1">Dub</span>
                </span>
              </div>
            )}
          </div>
          <div className={styles.episodecontent}>
            <div className={styles.epnumlist}>
              {filteredEp.map((item, index) => (
                <EpNumList key={index} item={item} epnum={epnum} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerEpisodeList;
