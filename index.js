// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");
const launchDocument = require("documents/launchDocument.json");
const playDocument = require("documents/playDocument.json");
const screenDocument = require("documents/screenDocument.json");
const util = require("./util");

function renderDocumentForScreen(document, handlerInput, text, assets) {
  if (
    Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)[
      "Alexa.Presentation.APL"
    ]
  ) {
    handlerInput.responseBuilder.addDirective({
      type: "Alexa.Presentation.APL.RenderDocument",
      document,
      datasources: {
        text,
        assets
      }
    });
  } else {
    console.error("Device does not support APL");
  }
}

function buildNotInitializedResponse(handlerInput) {
  const speakOutput = "You are still spleeping, say play to wake up.";
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
}

function buildNotStandUpResponse(handlerInput) {
  const speakOutput = "You are lying on the floor, try to stand up first.";
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
}

function buildOutOfBoundsResponse(handlerInput, direction) {
  const speakOutput = `You see a wall of trees blocking the road to the ${direction}, try moving to a different direction`;
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
}

function handleMovement(direction) {
  const nextPosition = {
    x: player.position.x,
    y: player.position.y
  };

  if (direction === "east") {
    nextPosition.x += 1;
  } else if (direction === "west") {
    nextPosition.x -= 1;
  } else if (direction === "north") {
    nextPosition.y -= 1;
  } else if (direction === "south") {
    nextPosition.y += 1;
  }

  // == null to avoid checking undefined too
  if (
    maze[nextPosition.x] == null ||
    maze[nextPosition.x][nextPosition.y] == null
  ) {
    return { outBounds: true };
  }

  const tile = maze[nextPosition.x][nextPosition.y];

  let isExit = false;

  let speakOutput = "";
  let imageSrc = "";
  let isHit = false;

  switch (tile) {
    case "bat":
      isHit = Math.ceil(Math.random() * 101) - 1 > 50;
      speakOutput = isHit
        ? "You found a bat an immediately bites you! . you lost 1 point of health."
        : "a bat stares at you but seems like is distracted with a different prey. ";
      imageSrc = "bat.svg";
      player.life = isHit ? player.life - 1 : player.life;
      break;
    case "wolf":
      isHit = Math.ceil(Math.random() * 101) - 1 > 50;
      speakOutput = isHit
        ? "A wolf starts chasing you and ends up doing serious damage . you lost 1 point of health."
        : "You found a wolf, but he's ignoring you because you seem too weak. ";
      imageSrc = "wolf.svg";
      player.life = isHit ? player.life - 1 : player.life;
      break;
    case "empty":
      speakOutput =
        "There's nothing here, only trees and the moon in the sky. ";
      imageSrc = "empty.svg";
      break;
    case "bonfire":
      player.life = player.life + 1;
      speakOutput =
        "You found an abandoned bonfire, part of your health is restored. You recovered 1 point of health. ";
      imageSrc = "bonfire.svg";
      break;
    case "exit":
      speakOutput = `Hooorrayy, you finally found the exit. After leaving the forest you promise yourself that you will never come back, so you burn it. 
                Hours after, in your plane back to home, you realize it starts falling down into a different forest. Before the crash everything fades away again.
                 The End?`;
      isExit = true;
      imageSrc = "exit.svg";
      break;
  }

  let dieText = "";
  player.position = nextPosition;

  if (player.life <= 0) {
    dieText =
      " After being hit you lie in the ground without energy. Seconds after everything fades away. ";
    reset();
  }

  if (isExit) {
    reset();
  }

  return {
    speakOutput,
    dieText,
    imageSrc
  };
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

  if (maze[1][1] === "exit") {
    maze[3][4] = "exit";
    maze[1][1] = "empty";
  }

  return maze;
}

function reset() {
  maze = createMaze(8, 8);
  player.position = { x: 1, y: 1 };
  player.life = 5;
  initialized = false;
  standUp = false;
}

let maze = [];
let initialized = false;
let standUp = false;
let player = {
  position: {
    x: 1,
    y: 1
  },
  life: 5
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const text = {
      type: "object",
      welcome: "Welcome",
      middle: "to",
      end: "creepy maze!"
    };

    const assets = {
      forest: util.getS3PreSignedUrl("Media/forest.svg")
    };

    renderDocumentForScreen(launchDocument, handlerInput, text, assets);

    const speakOutput =
      "Welcome to creepy maze! . To play creepy maze you can say play or if you need help say help";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
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

    reset();
    initialized = true;

    const text = {
      type: "object",
      main:
        "You woke up at night, in the middle of the forest. You can tell by the trees that surround you. Try to stand up."
    };

    const assets = {
      wakingUp: util.getS3PreSignedUrl("Media/1.png")
    };

    renderDocumentForScreen(playDocument, handlerInput, text, assets);

    const speakOutput = text.main;
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
      extraText = "You are already stand up. But ";
    }

    standUp = true;

    const text = {
      type: "object",
      main:
        "you only see trees and four different directions. Move by saying go north, go south, go west or go east, to escape from this creepy forest. ",
      life: "-1"
    };

    const assets = {
      mainImage: util.getS3PreSignedUrl("Media/forest2.svg")
    };

    renderDocumentForScreen(screenDocument, handlerInput, text, assets);

    const speakOutput = text.main;
    return handlerInput.responseBuilder
      .speak(extraText + speakOutput)
      .reprompt(extraText + speakOutput)
      .getResponse();
  }
};

const EastIntentIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "EastIntent"
    );
  },
  handle(handlerInput) {
    if (!initialized) {
      return buildNotInitializedResponse(handlerInput);
    }

    if (!standUp) {
      return buildNotStandUpResponse(handlerInput);
    }

    console.log("EAST INTENT", "maze", maze, "player", player);

    const { speakOutput, dieText, outBounds, imageSrc } = handleMovement(
      "east"
    );

    if (outBounds) {
      return buildOutOfBoundsResponse(handlerInput, "east");
    }

    const hideLife = dieText !== "" || imageSrc === "exit.svg";

    const text = {
      type: "object",
      main: speakOutput,
      life: hideLife ? "-1" : player.life + ""
    };

    const assets = {
      mainImage: util.getS3PreSignedUrl(`Media/${imageSrc}`)
    };

    renderDocumentForScreen(screenDocument, handlerInput, text, assets);

    return handlerInput.responseBuilder
      .speak(speakOutput + dieText)
      .reprompt(speakOutput + dieText)
      .getResponse();
  }
};

const WestIntentIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "WestIntent"
    );
  },
  handle(handlerInput) {
    if (!initialized) {
      return buildNotInitializedResponse(handlerInput);
    }

    if (!standUp) {
      return buildNotStandUpResponse(handlerInput);
    }

    const { speakOutput, dieText, outBounds, imageSrc } = handleMovement(
      "west"
    );

    if (outBounds) {
      return buildOutOfBoundsResponse(handlerInput, "west");
    }

    const hideLife = dieText !== "" || imageSrc === "exit.svg";

    const text = {
      type: "object",
      main: speakOutput,
      life: hideLife ? "-1" : player.life + ""
    };

    const assets = {
      mainImage: util.getS3PreSignedUrl(`Media/${imageSrc}`)
    };

    renderDocumentForScreen(screenDocument, handlerInput, text, assets);

    return handlerInput.responseBuilder
      .speak(speakOutput + dieText)
      .reprompt(speakOutput + dieText)
      .getResponse();
  }
};

const NorthIntentIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "NorthIntent"
    );
  },
  handle(handlerInput) {
    if (!initialized) {
      return buildNotInitializedResponse(handlerInput);
    }

    if (!standUp) {
      return buildNotStandUpResponse(handlerInput);
    }

    const { speakOutput, dieText, outBounds, imageSrc } = handleMovement(
      "north"
    );

    if (outBounds) {
      return buildOutOfBoundsResponse(handlerInput, "north");
    }

    const hideLife = dieText !== "" || imageSrc === "exit.svg";

    const text = {
      type: "object",
      main: speakOutput,
      life: hideLife ? "-1" : player.life + ""
    };

    const assets = {
      mainImage: util.getS3PreSignedUrl(`Media/${imageSrc}`)
    };

    renderDocumentForScreen(screenDocument, handlerInput, text, assets);

    return handlerInput.responseBuilder
      .speak(speakOutput + dieText)
      .reprompt(speakOutput + dieText)
      .getResponse();
  }
};

const SouthIntentIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "SouthIntent"
    );
  },
  handle(handlerInput) {
    if (!initialized) {
      return buildNotInitializedResponse(handlerInput);
    }

    if (!standUp) {
      return buildNotStandUpResponse(handlerInput);
    }

    const { speakOutput, dieText, outBounds, imageSrc } = handleMovement(
      "south"
    );

    if (outBounds) {
      return buildOutOfBoundsResponse(handlerInput, "south");
    }

    const hideLife = dieText !== "" || imageSrc === "exit.svg";

    const text = {
      type: "object",
      main: speakOutput,
      life: hideLife ? "-1" : player.life + ""
    };

    const assets = {
      mainImage: util.getS3PreSignedUrl(`Media/${imageSrc}`)
    };

    renderDocumentForScreen(screenDocument, handlerInput, text, assets);

    return handlerInput.responseBuilder
      .speak(speakOutput + dieText)
      .reprompt(speakOutput + dieText)
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
            The only objective is to escape the forest and not die. Say play to start your journey.`;

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
    EastIntentIntentHandler,
    WestIntentIntentHandler,
    NorthIntentIntentHandler,
    SouthIntentIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
