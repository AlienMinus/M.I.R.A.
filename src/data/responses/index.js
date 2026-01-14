import greetings from "./greetings.json";
import help from "./help.json";
import smalltalk from "./smalltalk.json";
import jokes from "./jokes.json";
import about from "./about.json";
import errors from "./errors.json";
import extended from "./extended.json";
import commands from "./commands.json";


const responsesData = {
  ...greetings,
  ...help,
  ...smalltalk,
  ...jokes,
  ...about,
  ...errors,
  ...extended,
  ...commands
};

export default responsesData;
