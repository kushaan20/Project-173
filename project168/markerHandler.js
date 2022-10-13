var uidNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function() {

    if (toyNumber === null) {
      this.askUidNumber();
    }

    var toys = await this.getToys();

    this.el.addEventListener("markerFound", () => {
      var markerId = this.el.id;
      this.handleMarkerFound(toys, markerId);
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askUidNumber: function() {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title:"Welcome!",
      icon:iconUrl,
      content:{
        element:"input",
        attributes:{
          placeholder:"Enter Your UID Number",
          type:"number",
          min:"1",
        }
      },
      closeOnClickOutside:false
    }).then(val=>{
      uidNumber=val
    })
  },

  handleMarkerFound: function(toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is out of stock today!",
        timer: 2500,
        buttons: false
      });
    } else {
       // Changing Model scale to initial scale
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      //Update UI content VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)
      model.setAttribute("visible",true)

      var mainPlane = document.querySelector(`#main-plane-${toy.id}`)
      mainPlane.setAttribute("visible",true)

      var pricePlane = document.querySelector(`#price-plane-${toy.id}`)
      pricePlane.setAttribute("visible",true)
      
      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");

      // Handling Click Events
      ratingButton.addEventListener("click", () => this.handleRatings(toy));

      orderButtton.addEventListener("click", () => {
      this.handleOrder()

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order!",
          text: "Your order will be delivered!",
          timer: 2000,
          buttons: false
        });

        orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );
      });
    }
  },
  handleOrder: function(uid, toy) {
    firebase.firestore()
    .collection("users")
    .doc(uid)
    .get()
    .then(snap=> {
      var details = doc.data()
      if(details["current_orders"][toy.id]){
        details["current_orders"][toy.id]["quantity"]+=1
        details["current_orders"][toy.id]["subTotal"] = details["current_orders"][toy.id]["quantity"]*toy.price
      }else{
        details["current_orders"][toy.id]={
          item:toy.toy_name,
          price:toy.price,
          quantity:1,
          subTotal:toy.price
        }
      }
      details.total_bill+=toy.price
      firebase.firestore().collection("users").doc(doc.id).update(details)
    })
  },

  getToys: async function() {
    return await firebase
      .firestore()
      .collection("users")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },

  getOrderSummary: async function (tNumber) {
    return await firebase
      .firestore()
      .collection("toys")
      .doc(tNumber)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function () {
    var tNumber;
    toyNumber <= 9 ? (tNumber = `T0${toyNumber}`) : `T${toyNumber}`;

    var orderSummary = await this.getOrderSummary(tNumber);

    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    var toyBodyTag = document.getElementById("bill-toy-body");

    toyBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      var tr = document.createElement("tr");

      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      toyBodyTag.appendChild(tr);
    });

  var totalTr = document.createElement("tr")
  var td1 = document.createElement("td")
  td1.setAttribute("class","no-line")  
  var td2 = document.createElement("td")
  td2.setAttribute("class","no-line")  
  var td3 = document.createElement("td")
  td3.setAttribute("class","no-line text-center")  
  var strong1 = document.createElement("strong")
  strong1.innerHTML = "Total"
  td3.appendChild(strong1)
  var td4 = document.createElement("td")
  td4.setAttribute("class","no-line text-center")
  td4.innerHTML = "$"+orderSummary.total_bill

  totalTr.appendChild(td1)
  totalTr.appendChild(td2)
  totalTr.appendChild(td3)
  totalTr.appendChild(td4)
  toyBodyTag.appendChild(totalTr)
  
  },
  handlePayment: function () {
    document.getElementById("modal-div").style.display = "flex";
    var tNumber;
        toyNumber <= 9 ? (tNumber = `T0${toyNumber}`) : `T${toyNumber}`;
    firebase.firestore().collection("toys").doc(tNumber).update({
      total_bill : 0,
      current_orders : {}
    }).then(() => {
      swal({
        title: "Payment Completed!",
        icon: "success",
        text: "Thank you for shopping with us!",
        closeOnClickOutside: true,
      })
    })
  },

  handleRatings: async function (dish) {
    var tNumber;
    toyNumber <= 9 ? (tNumber = `T0${toyNumber}`) : `T${toyNumber}`;

    var orderSummary = await this.getOrderSummary(tNumber)
    var currentOrders = Object.keys(orderSummary.current_orders);
    
    if(currentOrders.length > 0){
      document.getElementById("rating-modal-div").style.display = "flex";
      document.getElementById("rating-input").value = "0";
      document.getElementById("feedback-input").value = "";

      var submit = document.getElementById("save-rating-button")
      submit.addEventListener("click",() => {
        document.getElementById("rating-modal-div").style.display = "none";
        var rating = document.getElementById("rating-input").value 
        var feedback = document.getElementById("feedback-input").value 
        firebase.firestore().collection("toys").doc(toy.id).update({
          last_rating:rating,
          last_review:feedback,
        }).then(() => {
          swal({
            icon:"success",
            title:"Review Submitted!",
            buttons:false,
          })
        })
      })
    } else{
      swal({
        icon:"warning",
        title:"Please Order Something First!",
        text:"You need to order something to be able to leave a review!",
        buttons:false,
      })
    }
  },

  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});