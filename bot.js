console.log("Botje loading, to initialize open a chat window and type: `botje.init();` in the console.`");

var botje = botje || (function(){
  // Default settings.
  var delay = 250;
  var emojiNumber = 1096;
  var votekickMinutes = 3;

  // Do not edit these.
  var vote = { minutesLeft: 0, user: "", votesYes: 0, votesNo: 0, voted: [], action: "" };
  var lastAuthor = "";
  var lastMessage = "";
  var myLastMessage = "";
  var ping = false;

  return {
    init : function (args) {
      if (args) {
        if (args.delay) delay = args.delay;
        if (args.emojiNumber) emojiNumber = args.emojiNumber;
        if (args.votekickMinutes) votekickMinutes = args.votekickMinutes;
      }

      if (!window.jQuery) {
        debug("Loaded jQuery.")

        var jq = document.createElement('script');
        jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js";
        document.getElementsByTagName('head')[0].appendChild(jq);
      }

      debug("Enabling listener in current chat window");

      document.getElementsByClassName("message-list")[0].addEventListener('DOMSubtreeModified', function () {
        var authors = this.getElementsByClassName("message-author");
        var author  = authors[authors.length - 1].getElementsByClassName("text-clickable")[0].innerText;
        var messages = this.getElementsByClassName("message-text");
        var message  = messages[messages.length - 1].getElementsByClassName("selectable-text")[0].innerText;

        if ((message !== lastMessage && message !== myLastMessage) || author !== lastAuthor) {
          lastAuthor = author;
          lastMessage = message;

          debug(author + ": " + message);

          messageParts = message.split(" ");

          if (messageParts.length > 2 && messageParts[0] === "/votekick") {
              if (messageParts[1].toLowerCase().indexOf("aron") === -1 && startVotekick(messageParts[1])) {
                var reason = message.substr(message.indexOf(messageParts[1]) + messageParts[1].length + 1);
                sendMessage("Votekick started for user: " + messageParts[1] + ", type /y or /n to vote! Reason for vote: " + reason);
              }
          } else if (messageParts.length > 2 && messageParts[0] === "/voteadd") {
              if (startVoteadd(messageParts[1])) {
                var reason = message.substr(message.indexOf(messageParts[1]) + messageParts[1].length + 1);
                sendMessage("Voteadd started for user: " + messageParts[1] + ", type /y or /n to vote! Reason for vote: " + reason);
              }
          } else if (messageParts[0] === "/roll") {
            let min = 0;
            let max = 10;
            if (messageParts.length > 2) {
              min = messageParts[1];
              max = messageParts[2];
            }

            sendMessage(`Rolling between ${min} and ${max}, result: ${Math.round(Math.random() * (min + max) - min)}`)
          } else if (messageParts.length === 1 && (messageParts[0] === "/y" || messageParts[0] === "/yes")) {
            if (vote.voted.indexOf(author) === -1) {
              vote.votesYes += 1;
              vote.voted.push(author);
              sendMessage(author + " voted Yes, current standing: " + vote.votesYes + "y/" + vote.votesNo + "n!");
            }
          } else if (messageParts.length === 1 && (messageParts[0] === "/n" || messageParts[0] === "/no")) {
            if (vote.voted.indexOf(author) === -1) {
              vote.votesNo += 1;
              vote.voted.push(author);
              sendMessage(author + " voted No, current standing: " + vote.votesYes + "y/" + vote.votesNo + "n!");
            }
          } else if (messageParts.length === 1 && (messageParts[0] === "/h" || messageParts[0] === "/help")) {
            sendMessage("HELP: /votekick [number] [reason] to votekick, /voteadd [number] [reason] to voteadd, /y to vote yes, /n to vote no, /s to get the source, /h to get help");
          } else if (messageParts.length === 1 && (messageParts[0] === "/s" || messageParts[0] === "/source")) {
            sendMessage("You can find the source code on github: https://github.com/Aronnn/Spooky-Bot");
          } else if (messageParts.length === 1 && messageParts[0].toLowerCase() === "pong!" && ping) {
            sendMessage(author + " won this amazing game! Congrats!");
            ping = false;
          }
        }
      }, false);

      debug("Sucessfully initialized");
    },
    ping : function () {
      ping = true;
      sendMessage("Ping!");
    }
  };

  function startVotekick(user) {
    if (startVote(vote, user)) {
      vote.action = "kick"
      return true;
    }
    return false;
  }

  function startVoteadd(user) {
    if (startVote(vote, user)) {
      vote.action = "add"
      return true;
    }
    return false;
  }

  function startVote(vote, user) {
    if (vote.minutesLeft > 0) {
      debug(vote.action + " still in progress, cannot start a new one.");
      return false;
    }

    vote.user = user;
    vote.votesYes = 0;
    vote.votesNo = 0;
    vote.voted = [];
    vote.minutesLeft = votekickMinutes;

    setTimeout(function () { pulseVote(vote); }, 60 * 1000);

    debug(vote.action + " voting started for user: " + user);

    return true;
  }

  function pulseVote(vote) {
    vote.minutesLeft--;

    if (vote.minutesLeft > 0) {
      sendMessage(vote.minutesLeft + " minutes left to " + vote.action + " '" + vote.user + "', type /y or /n to vote! Current standing: " + vote.votesYes + "y/" + vote.votesNo + "n!");
      setTimeout(function () { pulseVote(vote); }, 60 * 1000);
    } else {
      if (vote.votesYes > vote.votesNo) {
        sendMessage("Times up! I will " + vote.action + " " + vote.user + "! (" + vote.votesYes + "y/" + vote.votesNo + "n)");
      } else {
        sendMessage("Times up! I will not " + vote.action + " " + vote.user + "! (" + vote.votesYes + "y/" + vote.votesNo + "n)");
      }
    }
  }

  // We have to mkae it click on an emoji in order to send a message.
  function sendMessage(message) {
    debug("Send message: " + message);

    myLastMessage = " " + message;

    setTimeout(function () {
      $("div.input").html(" " + message);

      var emojiButton = getElementByXpath('//*[@id="main"]/footer/div/button[1]');
      emojiButton.click();

      setTimeout(function () {
        var emoji = getElementByXpath('//*[@id="main"]/footer//span[contains(@class, "emojiordered' + emojiNumber + '")]');
        emoji.click();

        setTimeout(function () {
          var sendButton = getElementByXpath('//*[@id="main"]/footer/div/button[2]');
          sendButton.click();
        }, delay);
      }, delay);
    }, delay);
  }

  function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  function debug(message) {
    console.log("BOTJE: " + message);
  }
}());
