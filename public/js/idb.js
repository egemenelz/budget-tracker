// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_tracker', { autoIncrement: true });
};
// upon a successful 
request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadBudget();
    }
};

/**
 * IN CASE OF ERROR THIS FUNCTION WILL TRIGGER
 */
request.onerror = function (event) {

    console.log(event.target.errorCode);
};

/**
 * SaveRecord function will trigger if the user send a request without connection
 * it will open a transaction at the database with read and write permissions
 * @param(record)
 */ 
function saveRecord(record) {
    const transaction = db.transaction(["new_budget"], "readwrite");
    const budgetObjectStore = transaction.objectStore("new_budget");
    budgetObjectStore.add(record);
}
/**
 * This function will upload the created budget while there is no connection.
 */
function uploadBudget() {
    // open a transaction on your db
    const transaction = db.transaction(["new_budget"], "readwrite");

    // access your object store
    const budgetObjectStore = transaction.objectStore("new_budget");

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })
                .then((response) => response.json())
                .then((serverResponse) => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(["new_budget"], "readwrite");
                    // access the new_budget object store
                    const budgetObjectStore = transaction.objectStore("new_budget");
                    // clear all items in your store
                    budgetObjectStore.clear();

                    alert("Transactions have been submitted!");
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    };
}

/**
 * This eventlistener is used to listen the app for if the app online. 
 */
window.addEventListener("online", uploadBudget);