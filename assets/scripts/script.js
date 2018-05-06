// Two variables for player positions. First click received from users assigns var 1 to that user. Next click assigns var 2 to 2nd user. All subsequent clicks assign spectator state to users where input is not permitted in game, only chat. 

// Input from user 1 logged into their own directory. Input from user 2 logged into own. Compare values, using RPS logic, to determine winner.

// Update displays to reflect stats, offer option to rematch or quit. Quit assigns spectator state, opens player position up for new player.



//<div id="matchResultDisplay"></div>
//$("#matchResultDisplay").on("click", function(event) {
//    event.stopPropagation();
//if 
//});

/* global moment firebase */

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCeI5DSN9DOhPZSGC4dLKKGK_JZ3yqfKeE",
  authDomain: "rps-multiplayer-2313d.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-2313d.firebaseio.com",
  projectId: "rps-multiplayer-2313d",
  storageBucket: "rps-multiplayer-2313d.appspot.com",
  messagingSenderId: "458806957422"
};
firebase.initializeApp(config);


// Create a variable to reference the database.
var database = firebase.database();

// --------------------------------------------------------------
// Link to Firebase Database for viewer tracking

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated every time
// the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");
// When the client's connection state changes...
connectedRef.on("value", function(snap) {

  // If they are connected..
  if (snap.val()) {

    // Add user to the connections list.
    var con = connectionsRef.push(true);

    console.log("connections: " + con);
    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
  }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {

  // Display the viewer count in the html.
  // The number of online users is the number of children in the connections list.
  $("#connected-viewers").text(snap.numChildren());
});



var player1 = null;
var player2 = null;

var localPlayer;
var otherPlayer;
var nameInput;

// Upon page load, copy player slot status from db to local
database.ref("/players").on("value", function(snapshot) {
  if (snapshot.child("player1").exists()) {
    console.log("player 1 exists: " + player1);
    player1 = snapshot.val().player1;
    $("#player1Name").text("Player 1: " + player1.name);
    $("#player1Wins").text("Wins: " + player1.wins);
    $("#player1Losses").text("Losses: " + player1.losses);
    $("#player1Ties").text("Ties: " + player1.ties);
  }
  if (snapshot.child("player2").exists()) {
    console.log("player 2 exists: " + player2);
    player2 = snapshot.val().player2;
    $("#player2Name").text("Player 2: " + player2.name);
    $("#player2Wins").text("Wins: " + player2.wins);
    $("#player2Losses").text("Losses: " + player2.losses);
    $("#player2Ties").text("Ties: " + player2.ties);
  }
});



// Listener for starting game once both players are ready
database.ref("/ready").on("value", function(snapshot){
  if ((snapshot.child("player1").exists()) && (snapshot.child("player2").exists())) {
    if ((snapshot.val().player1 === true) && (snapshot.val().player2 === true)) {
      database.ref("/moves/").remove();
      $("#matchMessageDisplay").text("Loading..");
      setTimeout(startMatch, 500);
    }
  }
});


// Enter name to join game
$("#submit-name").on("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  // Get the input values
  nameInput = $("#name-form").val().trim();
  console.log("clicking");
  $("#nameFormBox").addClass("d-none");
  
  // Check if slot 1 open
  if (player1 === null) {
    player1 = {
      name: nameInput,
      wins: 0,
      losses: 0,
      ties: 0
    }
    localPlayer = "player1";
    otherPlayer = "player2";
    database.ref().child("/players/player1").set(player1);
    database.ref("/players/player1").onDisconnect().remove();
    database.ref().child("/ready/player1").set(true);
    database.ref("/ready/player1").onDisconnect().remove();
    console.log("adding p1: " + nameInput);
    $("#player1Name").text("Player 1: " + nameInput);
    $("#matchPositionDisplay").text("You are Player 1");
  } else // Check if slot 2 open
  if (player2 === null) {
    player2 = {
      name: nameInput,
      wins: 0,
      losses: 0,
      ties: 0,
    }
    localPlayer = "player2";
    otherPlayer = "player1";
    database.ref().child("/players/player2").set(player2);
    database.ref("/players/player2").onDisconnect().remove();
    database.ref().child("/ready/player2").set(true);
    database.ref("/ready/player2").onDisconnect().remove();
    console.log("adding p2: " + nameInput);
    $("#player2Name").text("Player 2: " + nameInput);
    $("#matchPositionDisplay").text("You are Player 2");
  } else // If both slots full
  {
    console.log("game full!");
    $("#matchPositionDisplay").text("Game full. Spectating...");
  }

});

var localMove = null;
var otherMove = null;
var moveInput;
var winner;



function startMatch() {
  console.log("begin startMAtch");
  $("#matchMessageDisplay").text("Game start. Please make a move");
  //var message = "Game start. Please make a move";
  //database.ref().child("/message").set(message);
  //database.ref("/message").on("value", function(snapshot) {
  //  console.log(snapshot.val());
  //  $("#matchMessageDisplay").text(snapshot.val()); 
  //});

  // Enter your move
  $("#moveButtons").removeClass("d-none");
  $("#moveButtons .btn").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();
    // Get the input values
    moveInput = $(this).attr("id");
    $("#matchMessageDisplay").text("Your move: " + (moveInput.charAt(0).toUpperCase() + moveInput.slice(1)));
    database.ref().child(`/moves/${localPlayer}`).set(moveInput);
    database.ref(`/moves/${localPlayer}`).onDisconnect().remove();
    localMove = moveInput;
    $("#moveButtons").addClass("d-none");
    });   

}    

// Listener for status of player moves
database.ref("/moves").on("value", function(snapshot) {
  // Run winner check once both moves are made
  if (snapshot.child("player1").exists() && snapshot.child("player2").exists()) {
    player1Move = snapshot.val().player1;
    player2Move = snapshot.val().player2;
    otherMove = snapshot.val()[`${otherPlayer}`];

    if ((player1Move === "rock") && (player2Move === "scissors")) {
      winner = player1;
    } else if ((player1Move === "rock") && (player2Move === "paper")) {
      winner = player2;
    } else if ((player1Move === "scissors") && (player2Move === "rock")) {
      winner = player2;
    } else if ((player1Move === "scissors") && (player2Move === "paper")) {
      winner = player1;
    } else if ((player1Move === "paper") && (player2Move === "rock")) {
      winner = player1;
    } else if ((player1Move === "paper") && (player2Move === "scissors")) {
      winner = player2;
    } else if (player1Move === player2Move) {
      winner.name = "Tie";
    }
    console.log("Winner: " + winner);
    $("#matchMoveStatus").text("Other player's move: " + (otherMove.charAt(0).toUpperCase() + otherMove.slice(1)));
    if (winner === player1) {
      $("#matchMoveStatus").append("<br>Winner: " + player1.name);
      player1.wins++;
      player2.losses++;
    } else if (winner === player2) {
      $("#matchMoveStatus").append("<br>Winner: " + player2.name);
      player2.wins++;
      player1.losses++;
    } else {
      $("#matchMoveStatus").append("Tie game");
      player1.ties++;
      player2.ties++;
    }
    database.ref("/players").set({player1, player2});
    database.ref().child(`/ready/${localPlayer}`).set(false);
    $("#restart").removeClass("d-none");
    $("#restart").on("click", function(event) {
      event.preventDefault();
      event.stopPropagation();
      restartMatch(); 
    });   

  } // If player has not chosen but opponent has
  else if (snapshot.child(`${otherPlayer}`).exists()) {
    console.log("other player move exists");
    otherMove = snapshot.val()[`${otherPlayer}`];
    console.log(otherMove);
    $("#matchMoveStatus").text("Other player has made their move.");
  } // If player has chosen but opponent has not
  else if (moveInput) {
    $("#matchMoveStatus").text("Waiting for other player's move.");
  }

});




function restartMatch() {
  $("#restart").addClass("d-none");
  moveInput = null;
  $("#matchMessageDisplay").text("Waiting for opponent.");
  $("#matchMoveStatus").empty();
  database.ref().child(`/ready/${localPlayer}`).set(true);
     

}


// After winner decided




