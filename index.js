import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import * as dotenv from 'dotenv' 
dotenv.config()

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGO_URI); // it will create if fruitsDB does not exist
}

const itemsSchema = mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
})

const item2 = new Item({
    name: "Hit the + button to add new item"
})

const item3 = new Item({
    name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    Item.find({}).then(function (foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }

    })
        .catch(function (err) {
            console.log(err);
        });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).then(function (foundItems) {
        if (!foundItems) {
            // create new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save();
            res.redirect("/" + customListName)
        }
        else {
            // show an existing list
            res.render("list", { listTitle: foundItems.name, newListItems: foundItems.items });
        }


    });


})
app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })


    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }).then(function (foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        })
    }
})

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    console.log(listName);
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId).exec();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }).then(function (foundList) {
            foundList.items.pull(checkedItemId);
            foundList.save();
            res.redirect("/" + listName);
        })

    }

})

app.get("/about", function (req, res) {
    res.render("about");
})

app.listen(process.env.PORT || port, function () {
    console.log(`Todolist app listening on port ${port}`);
})