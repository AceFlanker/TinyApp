# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Purpose

**_BEWARE:_ This library was published for learning purposes. It is _not_ intended for use in production-grade software.**

This project was created and published by the original uploader, AceFlanker as part of his learnings at Lighthouse Labs. 

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` or `npm start` command.
- To test the app on your machine, please enter "http://localhost:8080/" into your favourite browser.

## Hightlights

### Tiny URLs

- Turns urls of any length in to a 6-character id (ex. http://localhost:8080/u/ehq3y7)
- Keeps a list of all of your URL entries and for you only, as long as you are registered :)
- Your favourite hub-series webiste (like GitHub) has changed their homepage address? No problem, TinyApp allows you to change the link as many times as you want! And delete them out right, of course.
- Share your Tiny URLs to friends and family, impress them by showing how your grandma can type out a web address without auto-completion!

### Errors

- Made a mistaking hacking someone else's TinyApp account? No worries, we will let you know what went wrong with a page dedicated to the type of you rookie mistake, stating the reason why we are keeping some distance from you.
- If your infractions are minor, like forgotting to type in your password or something, we will give a small alert message under the input field, instead of a silly page with a silly error message.

### What else? Hmm...piracy! No, p-r-i-v-a-c-y. Yes, privacy.

- We, at TinyApp, really care about your privacy. On a daily basis, we look at the traffic log on your URL's edit page to make sure nobody has accessed it.
- Of course, we already made sure they couldn't access your list or edit or delete your stuff in the first place. But, we are just making sure.
- Every visitor clicking your Tiny URLs will have an anonymous id displayed in the traffic log, keeping you guessing if your crush has visited your Tiny URL.
- Hashed passwords and cookies, but that's not really important.

Thanks!

## Presentation

!["Screenshot of TinyApp Homepage"](https://github.com/AceFlanker/TinyApp/blob/master/docs/Homepage.png)
TinyApp Homepage
<br>
!["Screenshot of the Error 403 Page"](https://github.com/AceFlanker/TinyApp/blob/master/docs/403.png)
The Dreaded 403
<br>
!["Screenshot of a Sign Up Error"](https://github.com/AceFlanker/TinyApp/blob/master/docs/email_alert.png)
User-friendly Hint During Registration
<br>
!["Screenshot of The Edit Page"](https://github.com/AceFlanker/TinyApp/blob/master/docs/edit_page.png)
Visitor Statistics
