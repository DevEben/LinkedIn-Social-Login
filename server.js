require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const routes = require('./routes.js');


app.set('view engine', 'ejs');


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(session({ secret: "process.env.SESSION_SECERT" }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// LinkedIn OAuth Configuration
const LINKEDIN_KEY = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const CALLBACK_URL = process.env.LINKEDIN_CALLBACK_URL;

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(
    new LinkedInStrategy(
        {
            clientID: LINKEDIN_KEY,
            clientSecret: LINKEDIN_SECRET,
            callbackURL: CALLBACK_URL,
            scope: ["email", "profile", "openid"],
        },
        (accessToken, refreshToken, profile, done) => {
            process.nextTick(async () => {
                try {
                    const email = profile.emails[0].value;
                    let user = await userModel.findOne({ email });
                    if (!user) {
                        const names = profile.displayName.split(' ');
                        user = await userModel.create({
                            firstName: names[0],
                            lastName: names[1] || '',
                            email,
                            isVerified: true,
                        });
                    }
                    return done(null, profile);
                } catch (error) {
                    console.error('Error during LinkedIn authentication:', error);
                    return done(error, false);
                }
            });
        }
    )
);

app.use('/', routes);

const port = 4455;

app.listen(port, () => {
  console.log('App listening on port ' + port);
});