// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "Welcome stranger. To play creepy maze you can say play or if you need help say help";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

function buildNotInitializedResponse(handlerInput) {
  const speakOutput = "You are still spleeping, say play to wake up.";
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
}

function createMaze(w, h) {
  const tiles = ["bat", "wolf", "empty", "bonfire", "exit"];
  let exitCreated = false;

  const maze = Array.from(Array(w)).map(row => {
    return Array.from(Array(h)).map(el => {
      const rand = Math.ceil(Math.random() * (exitCreated ? 4 : 5)) - 1;
      if (rand === 4) {
        exitCreated = true;
      }
      return tiles[rand];
    });
  });

  if (!exitCreated) {
    maze[maze.length - 1][maze[0].length - 1] = "exit";
  }

  const aux = maze[0][0];
  maze[0][0] = "p";
  maze[1][1] = aux;

  return maze;
}

function reset(player, maze) {
  maze = createMaze(5, 5);
  player.position = { x: 0, y: 0 };
  player.life = 5;
  initialized = false;
  standUp = false;
}

let maze;
let initialized = false;
let standUp = false;
const player = {
  position: {
    x: 0,
    y: 0
  },
  life: 5
};

const PlayIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "play"
    );
  },
  handle(handlerInput) {
    let speakReset = "";
    if (initialized) {
      speakReset = `You feel like you've been here ... but you instantly forgot what happened before. `;
    }

    reset(player, maze);
    initialized = true;

    const speakOutput =
      "You woke up at night, in the middle of the forest. You can tell by the trees that surround you. Try to stand up.";
    return handlerInput.responseBuilder
      .speak(speakReset + speakOutput)
      .reprompt(speakReset + speakOutput)
      .getResponse();
  }
};

const StandUpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "StandUpIntent"
    );
  },
  handle(handlerInput) {
    if (!initialized) {
      return buildNotInitializedResponse(handlerInput);
    }

    let extraText = "";

    if (standUp) {
      extraText = "You are already stand up.";
    }

    standUp = true;

    const speakOutput =
      "You only see trees and four different directions. Move by saying go north, go south, go west or go east. to escape from this creepy forest.";
    return handlerInput.responseBuilder
      .speak(extraText + speakOutput)
      .reprompt(extraText + speakOutput)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = `Hi stranger, creepy maze is a small game that showcase the capabilities of APL.
            The only objective is to escape the forest and not die.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = "Goodbye!";
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayIntentHandler,
    StandUpIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
