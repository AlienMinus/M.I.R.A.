import greetings from "./greetings.json";
import help from "./help.json";
import smalltalk from "./smalltalk.json";
import jokes from "./jokes.json";
import about from "./about.json";
import errors from "./errors.json";
import extended from "./extended.json";

const responsesData = {
  ...greetings,
  ...help,
  ...smalltalk,
  ...jokes,
  ...about,
  ...errors,
  ...extended,
};

export default responsesData;
