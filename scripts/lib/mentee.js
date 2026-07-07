const MENTEE_NAME = "MimiSpark";

const WELCOME_MESSAGES = [
  `Hey ${MENTEE_NAME}! Ready to build yourself a fresh playground for data analysis?`,
  `Hiya ${MENTEE_NAME} — let's spin up some data for you to dig into.`,
  `Welcome back, ${MENTEE_NAME}! Let's get you a shiny new SQLite database.`,
];

const ENCOURAGEMENTS = [
  "You've got this. Every query you write is a rep towards mastery.",
  "Real data, real practice — that's how this stuff sticks.",
  "This one's just for you. Go make some sense of it.",
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function welcome() {
  return pick(WELCOME_MESSAGES);
}

function encouragement() {
  return pick(ENCOURAGEMENTS);
}

module.exports = {
  MENTEE_NAME,
  welcome,
  encouragement,
};
