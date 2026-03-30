import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";

const winAmount = 300;

// Store active games
const games = new Map();

// Hangman ASCII art stages
const HANGMAN_STAGES = [
  "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```", // 0 wrong
  "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```", // 1 wrong
  "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```", // 2 wrong
  "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```", // 3 wrong
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```", // 4 wrong
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```", // 5 wrong
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```", // 6 wrong - game over
];

// Word list for the game
const WORDS = [
  "electricity",
  "donkey",
  "hardware",
  "xerox",
  "transistor",
  "computer",
  "desktop",
  "engineering",
  "hangman",
  "circuit",
  "imagination",
  "robot",
  "memory",
  "power",
  "submarine",
  "chess",
  "resistance",
  "matrix",
  "function",
  "laser",
  "mechanism",
  "bodyguard",
  "titanic",
  "global",
  "ozone",
  "bridge",
  "technology",
  "spider",
  "unpleasant",
  "pyramid",
  "sphere",
  "member",
  "warning",
  "yourself",
  "screen",
  "language",
  "elephant",
  "system",
  "internet",
  "parameter",
  "traffic",
  "network",
  "filter",
  "nucleus",
  "automatic",
  "microphone",
  "cassette",
  "operation",
  "country",
  "beautiful",
  "picture",
  "teacher",
  "superman",
  "undertaker",
  "alarm",
  "process",
  "keyboard",
  "electron",
  "certificate",
  "grandfather",
  "landmark",
  "relativity",
  "eraser",
  "design",
  "football",
  "human",
  "musician",
  "egyptian",
  "elephant",
  "queen",
  "message",
  "wallpaper",
  "nationality",
  "answer",
  "wrong",
  "statement",
  "forest",
  "puzzle",
  "voltage",
  "current",
  "mathematics",
  "wisdom",
  "dream",
  "supermarket",
  "database",
  "collection",
  "barrier",
  "project",
  "sunlight",
  "figure",
  "graph",
  "battle",
  "hundred",
  "signal",
  "thousand",
  "transformation",
  "daughter",
  "flower",
  "communication",
  "microwave",
  "electronic",
  "peace",
  "wireless",
  "delete",
  "wind",
  "brain",
  "control",
  "prophet",
  "freedom",
  "harbour",
  "confidence",
  "positive",
  "harvest",
  "hunger",
  "woman",
  "children",
  "stranger",
  "garden",
  "pleasure",
  "laughing",
  "between",
  "recognition",
  "tomorrow",
  "autumn",
  "monkey",
  "spring",
  "winter",
  "mountain",
  "classification",
  "typewriter",
  "success",
  "difference",
  "acoustics",
  "astronomy",
  "agreement",
  "sorrow",
  "christmas",
  "silver",
  "birthday",
  "championship",
  "friends",
  "comfortable",
  "diffusion",
  "murder",
  "policeman",
  "science",
  "desert",
  "basketball",
  "blood",
  "funeral",
  "silence",
  "garment",
  "merchant",
  "spirit",
  "punishment",
  "measurement",
  "ocean",
  "digital",
  "illusion",
  "tyrant",
  "castle",
  "passion",
  "magician",
  "remedy",
  "knowledge",
  "threshold",
  "number",
  "vision",
  "expectation",
  "absence",
  "mystery",
  "morning",
  "device",
  "thoughts",
  "spirit",
  "future",
  "mountain",
  "treasure",
  "machine",
  "whispering",
  "eternity",
  "reflection",
  "occurence",
  "achievement",
  "lightning",
  "secret",
  "environment",
  "shepherd",
  "confusion",
  "grave",
  "promise",
  "honour",
  "reward",
  "temple",
  "distance",
  "eagle",
  "saturn",
  "finger",
  "belief",
  "crystal",
  "fashion",
  "direction",
  "captain",
  "moment",
  "impossible",
  "permission",
  "logic",
  "analysis",
  "password",
  "english",
  "equalizer",
  "simulation",
  "emotion",
  "battle",
  "expression",
  "scissors",
  "trousers",
  "glasses",
  "department",
  "dictionary",
  "chemistry",
  "induction",
  "detail",
  "widow",
  "wealth",
  "health",
  "disaster",
  "volcano",
  "poverty",
  "limitation",
  "perfect",
  "intelligence",
  "infinite",
  "failure",
  "ignorance",
  "destination",
  "source",
  "resort",
  "satisfaction",
  "exam",
  "frequency",
  "selection",
  "substitution",
  "kingdom",
  "pattern",
  "management",
  "situation",
  "multiply",
  "treatment",
  "dollar",
  "intuition",
  "chapter",
  "magnet",
  "desire",
  "command",
  "action",
  "consciousness",
  "enemy",
  "security",
  "object",
  "happen",
  "happiness",
  "worry",
  "method",
  "tolerance",
  "error",
  "hesitation",
  "ratio",
  "record",
  "tongue",
  "supply",
  "vibration",
  "stress",
  "despair",
  "restaurant",
  "television",
  "video",
  "audio",
  "layer",
  "mixture",
  "doorbell",
  "cousin",
  "beard",
  "finance",
  "production",
  "invisible",
  "excitement",
  "afternoon",
  "office",
  "alpha",
  "illustration",
  "valley",
  "apartment",
  "necessary",
  "shortage",
  "almost",
  "furniture",
  "blanket",
  "suggestion",
  "overflow",
  "demonstration",
  "challenge",
  "compact",
  "tower",
  "question",
  "problem",
  "pressure",
  "beast",
  "encouragement",
  "afraid",
  "cavity",
  "appearance",
  "wonderful",
  "matter",
  "dimension",
  "business",
  "doubt",
  "conversation",
  "reaction",
  "psychology",
  "superstition",
  "smash",
  "horseshoe",
  "surprise",
  "nothing",
  "ladder",
  "opposite",
  "reality",
  "genius",
  "string",
  "dissent",
  "destruction",
  "expensive",
  "painting",
  "chicken",
  "wishing",
  "profession",
  "engineer",
  "hatred",
  "possession",
  "criticism",
  "zebra",
  "harmony",
  "personality",
  "overcome",
  "addition",
  "subtraction",
  "cipher",
  "encryption",
  "compression",
  "extension",
  "blessing",
  "meeting",
  "difficulty",
  "weapon",
  "against",
  "external",
  "internal",
  "legend",
  "servant",
  "secondary",
  "license",
  "directory",
  "statistics",
  "generate",
  "attraction",
  "sensitivity",
  "magnification",
  "someone",
  "symptom",
  "recipe",
  "service",
  "family",
  "island",
  "planet",
  "butterfly",
  "diving",
  "strength",
  "extreme",
  "opportunity",
  "illumination",
  "cable",
  "conflict",
  "interference",
  "receiver",
  "transmitter",
  "channel",
  "company",
  "grocery",
  "devil",
  "angel",
  "exactly",
  "document",
  "tutorial",
  "sound",
  "voice",
  "abbreviation",
  "abdomen",
  "abrupt",
  "absolute",
  "absorption",
  "abstract",
  "academy",
  "acceleration",
  "accelerate",
  "accident",
  "account",
  "acidification",
  "actress",
  "adaptation",
  "addiction",
  "adjustment",
  "admiration",
  "adoption",
  "advanced",
  "adventure",
  "advertisement",
  "agenda",
  "airport",
  "algorithm",
  "allocation",
  "aluminium",
  "ambiguity",
  "amphibian",
  "anaesthesia",
  "analogy",
  "anchor",
  "animation",
  "anode",
  "cathode",
  "apparent",
  "appendix",
  "approval",
  "approximation",
  "arbitrary",
  "architecture",
  "arithmetic",
  "arrangement",
  "article",
  "ascending",
  "ashamed",
  "asleep",
  "assassin",
  "assembly",
  "astonishment",
  "atmosphere",
  "awful",
  "bachelor",
  "backbone",
  "backtrack",
  "bacteria",
  "balance",
  "balloon",
  "banana",
  "barbecue",
  "baseball",
  "beaker",
  "background",
  "beggar",
  "behaviour",
  "benefit",
  "bidirectional",
  "biology",
  "blackboard",
  "blatant",
  "bladder",
  "bleeding",
  "blender",
  "bonus",
  "bottle",
  "bracket",
  "branch",
  "brilliant",
  "bubble",
  "bucket",
  "budget",
  "bullet",
  "burglar",
  "butcher",
  "bypass",
  "cafeteria",
  "calculator",
  "calibration",
  "campaign",
  "cancellation",
  "candidate",
  "candle",
  "carpenter",
  "carriage",
  "cartoon",
  "cascade",
  "casual",
  "catalyst",
  "category",
  "cement",
  "ceremony",
  "chairman",
  "checkout",
  "chimney",
  "chocolate",
  "cigarette",
  "circumference",
  "civilization",
  "classroom",
  "clearance",
  "client",
  "coconut",
  "coincidence",
  "colleague",
  "comfortable",
  "competition",
  "kangaroo",
  "kidnap",
  "journal",
  "jockey",
  "iteration",
  "isometric",
  "isolation",
  "invitation",
  "interval",
  "institution",
  "injection",
  "humanity",
  "housekeeper",
  "history",
  "heaven",
  "guitar",
  "greenhouse",
  "glory",
  "foundation",
  "formula",
  "fluctuation",
  "fiction",
  "extra",
  "emission",
  "elasticity",
  "earthquake",
  "dynamic",
  "doctorate",
  "divorce",
  "derivation",
  "nightmare",
  "virtue",
  "description",
];

/**
 * Get a random word for the game
 */
function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Create a new hangman game
 */
function createGame(gameId, word, playerId) {
  const game = {
    word,
    progress: word.split("").map(() => "_"),
    guesses: [],
    wrongGuesses: 0,
    playerId,
    startTime: Date.now(),
  };

  games.set(gameId, game);
  return game;
}

function getGame(gameId) {
  return games.get(gameId);
}

function deleteGame(gameId) {
  return games.delete(gameId);
}

function hasGame(gameId) {
  return games.has(gameId);
}

function processGuess(game, letter) {
  if (game.guesses.includes(letter)) {
    return { error: "already_guessed" };
  }

  game.guesses.push(letter);
  let correct = false;

  // Check if the letter is in the word
  for (let i = 0; i < game.word.length; i++) {
    if (game.word[i] === letter) {
      game.progress[i] = letter;
      correct = true;
    }
  }

  if (!correct) {
    game.wrongGuesses++;
  }

  // Check game state
  const won = game.progress.join("") === game.word;
  const lost = game.wrongGuesses >= 6;

  return {
    correct,
    won,
    lost,
    gameOver: won || lost,
  };
}

function createGameEmbed(game, isGameOver = false, won = false) {
  const embed = new EmbedBuilder()
    .setTitle("🎮 Hangman Game")
    .setColor(isGameOver ? (won ? 0x00ff00 : 0xff0000) : 0x0099ff);

  // Add hangman drawing
  embed.addFields({
    name: "Hangman",
    value: HANGMAN_STAGES[game.wrongGuesses] || HANGMAN_STAGES[0],
    inline: true,
  });

  // Add current word progress
  const displayWord = game.progress.join(" ");
  embed.addFields({
    name: "Word",
    value: `\`${displayWord}\``,
    inline: true,
  });

  // Add guessed letters
  if (game.guesses.length > 0) {
    const correctGuesses = game.guesses.filter((letter) =>
      game.word.includes(letter),
    );
    const wrongGuesses = game.guesses.filter(
      (letter) => !game.word.includes(letter),
    );

    let guessText = "";
    if (correctGuesses.length > 0) {
      guessText += `✅ Correct: ${correctGuesses.join(", ")}\n`;
    }
    if (wrongGuesses.length > 0) {
      guessText += `❌ Wrong: ${wrongGuesses.join(", ")}`;
    }

    embed.addFields({
      name: "Guessed Letters",
      value: guessText || "None yet",
      inline: false,
    });
  }

  // Add game status
  if (isGameOver) {
    if (won) {
      embed.addFields({
        name: "🎉 Result",
        value: `Congratulations! You won!\nThe word was: **${game.word}**\nYou have been awarded ${winAmount} 🥥!`,
        inline: false,
      });
    } else {
      embed.addFields({
        name: "💀 Result",
        value: `Game Over! You lost!\nThe word was: **${game.word}**`,
        inline: false,
      });
    }
  } else {
    embed.addFields({
      name: "Status",
      value: `Wrong guesses: ${game.wrongGuesses}/6\nGuesses remaining: ${6 - game.wrongGuesses}`,
      inline: false,
    });
  }

  return embed;
}

export default {
  name: "hangman",
  data: new SlashCommandSubcommandBuilder()
    .setName("hangman")
    .setDescription(`Play a game of Hangman! Win ${winAmount} 🥥`),
  async execute(interaction) {
    const gameId = `${interaction.guildId}_${interaction.user.id}`;

    // Check if there's already an active game in this channel
    if (hasGame(gameId)) {
      return interaction.reply({
        content: "❌ You already have an active Hangman game! Finish it first.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Create new game
    const word = getRandomWord();
    const game = createGame(gameId, word, interaction.user.id);

    // Create buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`hangman_guess_${gameId}`)
        .setLabel("Guess a Letter")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔤"),
      new ButtonBuilder()
        .setCustomId(`hangman_quit_${gameId}`)
        .setLabel("Quit Game")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌"),
    );

    const embed = createGameEmbed(game);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
  // Game management
  createGame,
  getGame,
  deleteGame,
  hasGame,

  // Game logic
  getRandomWord,
  processGuess,
  createGameEmbed,

  // Constants
  WORDS,
  HANGMAN_STAGES,
};
