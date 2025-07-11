const playlistimg = document.querySelector(".playlist img")
const songlist = document.querySelector(".song-list")
let currentSong = new Audio()
let currFolder;
const play = document.getElementById("play")
let currentIndex = 0;
let card = document.getElementsByClassName("card")
let songUl = songlist.getElementsByTagName("ul")[0]
let songs = []
let playlists=[]
const playlistContainer=document.getElementById("playlistContainer")
const playlistform=document.querySelector(".playlistform")
const newplaylist=document.getElementById("newplaylist")

function formatTime(seconds) {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderPlaylists(){
    playlistContainer.innerHTML=""
    playlists.forEach((playlist)=>{
        const li=document.createElement("li");
        li.classList.add("lis")
        li.innerHTML=playlist;
        playlistContainer.appendChild(li)
    })
}

async function displayAlbums() {
    // fetching the albums inside songs
    let a = await fetch(`http://127.0.0.1:3000/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".trending");
    let array = Array.from(anchors)
    for (let index = 0; index < array.length-1; index++) {
        const element = array[index];
        if (element.href.includes("/songs")) {
            let folder = element.href.split("/").slice(-2)[0]
            // fetching the metadata of folder
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`)
            let response = await a.json();
            cardContainer.innerHTML+=`<div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="https://cdn.hugeicons.com/icons/play-solid-standard.svg" alt="">
                        </div>
                        <img class="images" style="border-radius:10px; height:100%;" src="songs/${folder}/cover.jpg"
                            alt="">
                        <div style="padding:6px 0px">${response.title}</div>
                        <div style="font-size:10px">${response.description}</div>
                    </div>`
        }
    }
}

async function getSongs(folder) {
    // fetching the songs of specific folder
    currFolder = folder
    let a = await fetch(`http://127.0.0.1:3000/songs/${currFolder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href)
        }
    }

    return songs
}

async function playSong(song, pause = false) {
    // playing the song argument is the name of the song
    currentSong.src = `/songs/${currFolder}/` + song
    document.querySelector(".playbar").classList.remove("hidden")
    if (!pause) {
        currentSong.play()
        play.src = "images/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = song
    document.querySelector(".songtime").innerHTML = "00:00/00:00"

}

function setupEventListeners() {

    // making the songlist slide through from right
    playlistimg.addEventListener("click", (e) => {
        e.stopPropagation();
        if (songlist.classList.contains("hidden")) {
            songlist.classList.remove("hidden")
            songlist.classList.add("visible")
        }
        else {
            songlist.classList.remove("visible")
            songlist.classList.add("hidden")
        }
    })

    // removing the songlist when clicked anywhere of document except songlist
    document.addEventListener("click", (e) => {
        if (!songlist.contains(e.target)) {
            songlist.classList.remove("visible")
            songlist.classList.add("hidden")
        } else {
            songlist.classList.add("visible")
            songlist.classList.remove("hidden")
        }
    })

    // play the song that is clicked in songlist
    songUl.addEventListener("click", (e) => {
        const clickedLi = e.target.closest("li")
        if (clickedLi) {

            let songname = clickedLi.querySelector(".info div").textContent.trim()
            currentIndex = songs.findIndex((song) => song.includes(songname))
            if (currentIndex != -1) playSong(songname)
        }
    })

    // play the previous song
    document.querySelector("#previous").addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            playSong(songs[currentIndex].split(`/songs/${currFolder}/`)[1]);
        }
    })

    // play the next song
    document.querySelector("#next").addEventListener("click", () => {
        if (currentIndex < songs.length - 1) {
            currentIndex++;
            playSong(songs[currentIndex].split(`/songs/${currFolder}/`)[1]);
        }
    })

    // play or pause the song
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            play.src = "images/pause.svg"
            currentSong.play()
        } else {
            currentSong.pause()
            play.src = "images/play.svg"
        }

    })

    // update the time inside playbar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    // control the seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        document.querySelector(".circle").style.left = (e.offsetX / e.target.getBoundingClientRect()["width"]) * 100 + "%"
        currentSong.currentTime = (e.offsetX / e.target.getBoundingClientRect()["width"]) * currentSong.duration
    })

    newplaylist.addEventListener("click", ()=>{
        document.querySelector("#createplaylist").classList.toggle("hidden")
    })

    document.getElementById("cross").addEventListener("click", ()=>{
        document.querySelector("#createplaylist").classList.toggle("hidden")
    })

    playlistform.addEventListener("submit", (e)=>{
        e.preventDefault()
        let name=(document.getElementById("inputname").value.trim())
        if(name){
            playlists.push(name);
            renderPlaylists();
            document.querySelector("#createplaylist").classList.toggle("hidden")
            document.getElementById("inputname").value=""
        }
    })

}
async function main() {
    setupEventListeners()

    await displayAlbums()

    // set a default song at start
    let def = await getSongs("cs")
    playSong(def[0].split("cs/")[1], true)

    //  change songlist when the card is clicked
    Array.from(card).forEach((e) => {
        e.addEventListener("click", async (event) => {
            songUl.innerHTML = "";
            let foldername = event.currentTarget.dataset.folder
            await getSongs(`${foldername}`)

            currentIndex=0
            for (const song of songs) {
                songUl.innerHTML += `<li style="overflow: hidden; display: flex;"><div class="info"><div><img class="invert" style="width:20px; padding-right:10px" src="images/songlist.svg"></img><span style="display: flex; align-items: start">${song.split(`${foldername}/`)[1]}</span></div><span><img class="invert" style="width:20px" src="images/play.svg"></img></span></div></li>`
            }

            playSong(songs[0].split(`${foldername}/`)[1])

        })
    })

}

main()