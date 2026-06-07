const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const random = express();
const cors = require('cors');
const { afterPath, firstPathSegment, sendRouteError } = require('./utils');
const USER_AGENT ="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";

random.use(cors());

random.get('/random', async ( req, res)=>{
    try {
        const ranlink = `https://aniwatchtv.to/random`;
    const randomlink = await axios.get(ranlink, {
        headers:{
            'User-Agent': USER_AGENT,
        }
    });

    const randomanime = randomlink.data;

    const $ = cheerio.load(randomanime);

    const randomAnime = [];

    $('.anis-content').each(function(index, element){
        const name = $(element).find('.dynamic-name').text();
        const jname = $(element).find('.dynamic-name').attr('data-jname');
        const pganime = $(element).find('.tick-pg').text();
        const quality = $(element).find('.tick-quality').text();
        const epsub = $(element).find('.tick-sub').text();
        const epdub = $(element).find('.tick-dub').text() || false;
        const totalep = $(element).find('.tick-eps').text() || false;
        const format = $(element).find('.item:eq(0)').text();
        const duration = $(element).find('.item:eq(1)').text();
        const desc = $(element).find('.text').text().trim();
        const id = afterPath($(element).find('.film-buttons a').attr('href'), '/watch/');
        const image = $(element).find('.film-poster img').attr('src');
        

        randomAnime.push({ name, jname, pganime, quality, epsub, epdub, totalep, format, duration, desc, id, image });
    });

    $('.anisc-info').each(function(index, element){
        const japanese = $(element).find('.name:eq(0)').text();
        const aired = $(element).find('.name:eq(2)').text();
        const premired = $(element).find('.name:eq(3)').text();
        const statusAnime = $(element).find('.name:eq(5)').text();
        const malscore = $(element).find('.name:eq(6)').text();
        const genre = $(element).find('.item-list a').map((index, element) => $(element).text()).get();
        const studio = $(element).find('.name:eq(7)').text();
        const producer = $(element).find('.item-title:eq(9) a').map((index,element) => $(element).text()).get();

        randomAnime.push({ japanese, aired, premired, statusAnime, malscore, genre, studio, producer});
    })

    $('.bac-list-wrap').each(function(index, element){
        const animechar = $(element).find('.bac-item').map((index, element) => ({name: $(element).find('.pi-name').text() || null, voice : $(element).find('.per-info.rtl h4').text() || null, animeImg : $(element).find('.per-info.ltr img').attr('data-src') || null, animedesignation : $(element).find('.pi-cast:first').text(), voicelang : $(element).find('.per-info.rtl span').text() || null, voiceImageX : $(element).find('.per-info.rtl img').attr('data-src') || null})).get() ;

        randomAnime.push({ animechar});
    })

    $('.block_area-seasons').each(function(){
        const season = $('.os-list a').map((index, element) => ({
            id:  firstPathSegment($(element).attr('href')), Seasonname: $(element).attr('title')})).get();
          


        randomAnime.push({ season});
    })
    
    res.json({ randomAnime });
    } catch (error) {
        sendRouteError(res, error, 'Unable to fetch random anime');
    }
})

module.exports = random;
