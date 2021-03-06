jcmp.events.Add("PlayerCreated", function(player) {

  player.escapedNametagName = player.name.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 40);
  console.log(`${player.escapedNametagName} has joined.`);

  var color = race.utils.randomColor();
  player.race = {
    ingame: false,
    colour: color,
    colour_rgb: race.utils.hexToRGB(color),
    warning: false,
    timers: [], // Daranix's workaround version
    checkpoints: 0, // index of the checkpoint of the player
    vehicle: "", // save the vehicle model to spawn an other when he die during the race
    hasfinish: false,
    time: 0,
    spawningdouble: false,
    playerrotationspawn: new Vector3f(0, 0, 0)
  }


  var dsend = {
    id: player.networkId,
    name: player.escapedNametagName,
    colour: player.race.colour
  };

  jcmp.events.CallRemote('race_player_created', null, JSON.stringify(dsend));

});

jcmp.events.Add('PlayerDestroyed', function(player) {

  console.log(`${player.escapedNametagName} has left.`);

  // Daranix's workaround clearinterval / timer

  if (player.race.timers.length >= 1) {
    for (let timer in player.race.timers) {
      console.log(timer);
    }
  }

  jcmp.events.CallRemote('race_player_destroyed', null, player.networkId);

  if (player.race.ingame) {
    jcmp.events.Call('race_player_leave_game', player, true);
  } else {
    race.game.players.onlobby.removePlayer(player);

  }

});

jcmp.events.AddRemoteCallable('race_debug', function(player, text) {
  console.log(text);
});

jcmp.events.AddRemoteCallable('race_clientside_ready', function(player) {

  const data = {
    players: jcmp.players.map(p => ({
      id: p.networkId,
      name: p.escapedNametagName,
      colour: p.race.colour
    }))
  };

  console.log(data);

  jcmp.events.CallRemote('race_ready', player, JSON.stringify(data));

});


jcmp.events.Add('PlayerReady', function(player) {

  race.game.players.onlobby.push(player);
  player.respawnPosition = race.utils.randomSpawn(race.config.game.lobby.pos, race.config.game.lobby.radius / 2);
  player.Respawn();

  console.log("Player added to lobby list");
  console.log(" * " + race.game.players.onlobby.length + " on lobby waiting");
  setTimeout(function() {
    jcmp.events.Call('Race_name_index', player);
  }, 2000);




});

jcmp.events.Add('PlayerDeath', function(player, killer, reason) {

  if (player.race.ingame) {
    jcmp.events.Call('race_player_checkpoint_respawn', player);

  }


  if (!player.race.ingame) {
    let killerName = 'Environment';
    if (killer != null) {
      killerName = killer.escapedNametagName;
    }
    console.log("NotIngame");

    jcmp.events.CallRemote('race_deathui_show', player, killerName);

    race.chat.send(player, "Respawning in 5 seconds ...")

    const done = race.workarounds.watchPlayer(player, setTimeout(() => {
      done();
      // NOTE: The death UI hides automatically
      console.log("Respawning playerdie");

      player.Respawn();
    }, 5000));
  }


});


jcmp.events.Add('PlayerVehicleExited', (player, vehicle, seatIndex) => {
  const Race = player.race.game;
  if (player.race.ingame) {

    jcmp.events.Call('race_player_checkpoint_respawn', player, vehicle);
  }
});
