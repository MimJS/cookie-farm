const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

let attemp = 1;
let plusCookies = 0;
let userData = {};

const init = () => {
  console.log("Cookie farm - start");
  createDumpsFolder();
  getMainData();
};

const createDumpsFolder = () => {
  try {
    if (!fs.existsSync("dumps")) {
      fs.mkdirSync("dumps");
    }
  } catch (e) {
    console.error(e);
  }
};

const getMainData = () => {
  axios
    .post(
      "https://phantom.cookieapp.ru/api/main/update",
      {
        payload: config.requestToken,
      },
      {
        headers: {
          Authorization: config.auth,
          "X-Sign": config.vkSign,
        },
      }
    )
    .then((res) => {
      if (res.data) {
        userData = res.data;
        console.log(`Cookie farm - user cookies: ${userData.cookies} cookies`);

        request();
      } else {
        console.log("Cookie farm - can't get user data");
        process.exit(1);
      }
    })
    .catch(catchError);
};

const request = () => {
  try {
    if (userData.cookies < 5) {
      console.log("Cookie farm - no cookies for spin");
      console.log(`Cookie farm - Plus: ${plusCookies}`);
      process.exit(1);
    }

    userData.cookies -= 5;
    plusCookies -= 5;

    axios
      .post(
        "https://phantom.cookieapp.ru/api/roulette/spin",
        {
          payload: config.requestToken,
        },
        {
          headers: {
            Authorization: config.auth,
            "X-Sign": config.vkSign,
          },
        }
      )
      .then((res) => {
        if (res.data.prize) {
          plusCookies += Number(res.data.prize);
          userData.cookies += Number(res.data.prize);

          console.log(
            `Cookie farm [#${attemp}] - WIN +${res.data.prize} cookies | Total plus: ${plusCookies} cookies | Cookie remains: ${userData.cookies}`
          );
        } else {
          console.log(
            `Cookie farm [#${attemp}] - no prize | Cookie remains: ${userData.cookies}`
          );
        }

        attemp += 1;

        setTimeout(() => {
          request();
        }, 1000);
      })
      .catch(catchError);
  } catch (e) {
    catchError(e);
  }
};

const catchError = (e) => {
  fs.writeFileSync(
    path.join(__dirname, "dumps", `${Date.now()}-crash.log`),
    JSON.stringify({
      description: "Some error occurred during app working",
      data: e,
    })
  );

  console.log("Cookie farm - new dump file created");
  process.exit(1);
};

init();
