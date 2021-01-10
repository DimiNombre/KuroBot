const { executionAsyncResource } = require('async_hooks');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
    key: "AIzaSyA1My-khAH8K59ezXiS1coMZhzmUryWo90",
    revealed: true
});

const client = new Discord.Client();

const queue = new Map();

client.on("ready", () => {
    console.log("Currently Online")
    client.user.setActivity('a Dimi gritar', { type: 'WATCHING'}).catch(console.error);

})

client.on("message", async(message) => {
    const prefix = '.';

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase();

    switch(command){
        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
        case 'pause':
            pause(serverQueue);
            break;
        case 'resume':
            resume(serverQueue);
            break;
    }

    async function execute(message, serverQueue){
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("Por favor, unete a un chat de voz primero.");
        }else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            const songInfo = await ytdl.getInfo(result.first.url)

            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };

            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };
                queue.set(message.guild.id, queueConstructor);

                queueConstructor.songs.push(song);

                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                }catch (err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`No me he podido unir al chat de voz :sob: ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send(`Se ha añadido la canción ${song.url}`);
            }
        }
    }
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`Escuchando :CatRave: ${serverQueue.songs[0].url}`)
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("Primero necesitas unirte a un chat de voz.")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("Necesitas unirte a un chat de voz primero.");
        if(!serverQueue)
            return message.channel.send("No hay nada que skipear ._.");
        serverQueue.connection.dispatcher.end();
    }
    function pause(serverQueue){
        if(!serverQueue.connection)
            return message.channel.send("No estás escuchando música.");
        if(!message.member.voice.channel)
            return message.channel.send("No estás en un chat de voz.")
        if(serverQueue.connection.dispatcher.paused)
            return message.channel.send("La canción ya está pausada.");
        serverQueue.connection.dispatcher.pause();
        message.channel.send("La canción se ha pausado.");
    }
    function resume(serverQueue){
        if(!serverQueue.connection)
            return message.channel.send("No estás escuchando música.");
        if(!message.member.voice.channel)
            return message.channel.send("No estás en un chat de voz.")
        if(serverQueue.connection.dispatcher.resumed)
            return message.channel.send("La canción ya está sonando.");
        serverQueue.connection.dispatcher.resume();
        message.channel.send("La canción se ha resumido.");
    }
})

client.login("Nzk3ODQxNjA1MTA4MTcwNzYy.X_sV5Q.xu8lGlzIxlggjeW3HBpK69Mt-aU")