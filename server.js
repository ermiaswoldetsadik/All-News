var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

app.get("/scrape", function(req, res) {
  axios.get("http://www.bioethics.net/news").then(function(response) {
    var $ = cheerio.load(response.data);
    $("h5").each(function(i, element) {
      var result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
        
          console.log(dbArticle);
        })
        .catch(function(err) {
      
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete!");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {

    db.Article.find()
      // Throw any errors to the console
      .then(function(dbPopulate) {
     
        res.json(dbPopulate);
      })
      .catch(function(err) {
      
        res.json(err);
      });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
 
  db.Article.findById(req.params.id)
  .populate("note")
  .then(function(dbPopulate) {
 
    res.json(dbPopulate);
  })
  .catch(function(err) {
  
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
 
  db.Note.create(req.body)
    .then(function(dbPopulate) {
      
      return db.Article.findOneAndUpdate({_id: req.params.id}, { $push: { note: dbPopulate._id } }, { new: true });
    })
    .then(function(dbPopulate) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
