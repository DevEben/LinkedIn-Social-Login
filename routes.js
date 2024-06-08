const express = require('express');
const router = express.Router();
const passport = require('passport');
const axios = require("axios");

router.get('/', function (req, res) {
  res.render('pages/index.ejs'); // load the index.ejs file
});

router.get('/profile', isLoggedIn, function (req, res) {
  res.render('pages/profile.ejs', {
    user: req.session.user // get the user out of session and pass to template
  });
});

// LinkedIn login route
const LINKEDIN_KEY = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const CALLBACK_URL = process.env.LINKEDIN_CALLBACK_URL;

router.get("/auth/linkedin",
    passport.authenticate("linkedin", { state: "SOMESTATE" })
);

router.get("/auth/linkedin/callback", async (req, res) => {
    try {
        const code = req.query.code;
        let access_token;

        // Access Token Retrieval
        const access_token_url = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${CALLBACK_URL}&client_id=${LINKEDIN_KEY}&client_secret=${LINKEDIN_SECRET}`;
        const res_token = await axios
            .post(access_token_url)
            .then((res) => {
                access_token = res.data.access_token;
            })
            .catch((err) => {
                console.log(err);
            });

        // Fetching User Data
        const user_info_url = `https://api.linkedin.com/v2/userinfo`;
        let user_info;
        if (access_token) {
            const res_user_info = await axios
                .get(user_info_url, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then((response) => {
                    user_info = response.data;
                })
                .catch((err) => {
                    console.log("ERROR: ", err);
                });
        } else {
            console.log("Access token not found");
        }

        // Step 4: Storing User Data (Database Operation)
        if (user_info) {
            req.session.user = user_info;
            user_info = user_info;

            const LinkedinID = user_info.sub;
            const name = user_info.name;
            const email = user_info.email;
            const picture = user_info.picture
                ? user_info.picture
                : "https://t3.ftcdn.net/jpg/03/64/62/36/360_F_364623623_ERzQYfO4HHHyawYkJ16tREsizLyvcaeg.jpg";

            // code to store user information to database

        } else {
            user_info = results[0];
        }


        // Redirecting User After Successful Authentication
        return res.redirect('/auth/linkedin/success');

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error" +error.message,
        });
    }
});

router.get("/auth/linkedin/success", async (req, res) => {
  if (req.session.user) {
    // console.log(req.session.user);
      return res.redirect('/profile'); // Redirect to the profile page
  } else {
      return res.redirect("/auth/linkedin/failure");
  }
});

router.get("/auth/linkedin/failure", (req, res) => {
  res.status(401).send("Authentication failed");
  res.redirect("/login");
  return ;
});


router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});


function isLoggedIn(req, res, next) {
  if (req.session.user)
    return next();
  // res.redirect('/');
}

module.exports = router;