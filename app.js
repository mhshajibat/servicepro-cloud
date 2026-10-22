
const form = document.getElementById("orderForm");
const ordersList = document.getElementById("ordersList");
const emptyMessage = document.getElementById("emptyMessage");
const formMessage = document.getElementById("formMessage");

const STORAGE_KEY = "servicepro-demo-orders";

let orders = loadOrders();

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(order =>
        order &&
        typeof order.id === "string" &&
        typeof order.customerName === "string" &&
        typeof order.phone === "string" &&
        typeof order.serviceType === "string" &&
        typeof order.address === "string" &&
        Number.isFinite(order.price) &&
        order.price >= 0 &&
        typeof order.status === "string"
      )
      .map(order => ({
        ...order,
        status:
          order.status === "পেন্ডিং"
            ? "Pending"
            : order.status
      }));
  } catch (error) {
    console.error("Saved data could not be loaded:", error);
    return [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("Orders could not be saved:", error);
    showMessage(
      "Unable to save data. Please check your browser storage.",
      true
    );
    return false;
  }
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(amount);
}

function renderOrders() {
  ordersList.replaceChildren();

  emptyMessage.hidden = orders.length > 0;

  orders.forEach(order => {
    const row = document.createElement("tr");

    const customerCell = document.createElement("td");

    const customerName = document.createElement("strong");
    customerName.textContent = order.customerName;

    const phone = document.createElement("span");
    phone.className = "customer-phone";
    phone.textContent = order.phone;

    customerCell.append(customerName, phone);

    const serviceCell = document.createElement("td");
    serviceCell.textContent = order.serviceType;

    const priceCell = document.createElement("td");
    priceCell.textContent = formatMoney(order.price);

    const statusCell = document.createElement("td");

    const statusBadge = document.createElement("span");
    statusBadge.className = "order-status";
    statusBadge.textContent = order.status;

    statusCell.append(statusBadge);

    const actionCell = document.createElement("td");

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-btn";
    deleteButton.textContent = "Delete";

    deleteButton.setAttribute(
      "aria-label",
      `Delete the order for ${order.customerName}`
    );

    deleteButton.addEventListener("click", () => {
      deleteOrder(order.id);
    });

    actionCell.append(deleteButton);

    row.append(
      customerCell,
      serviceCell,
      priceCell,
      statusCell,
      actionCell
    );

    ordersList.append(row);
  });

  document.getElementById("totalOrders").textContent =
    new Intl.NumberFormat("en-US").format(orders.length);

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.price,
    0
  );

  document.getElementById("totalRevenue").textContent =
    formatMoney(totalRevenue);

  const pendingCount = orders.filter(
    order => order.status === "Pending"
  ).length;

  document.getElementById("pendingOrders").textContent =
    new Intl.NumberFormat("en-US").format(pendingCount);
}

function deleteOrder(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this order?"
  );

  if (!confirmed) {
    return;
  }

  const previousOrders = orders;
  orders = orders.filter(order => order.id !== id);

  if (!saveOrders()) {
    orders = previousOrders;
    return;
  }

  renderOrders();
  showMessage("Order deleted successfully.");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const customerName = document
    .getElementById("customerName")
    .value.trim();

  const phone = document
    .getElementById("phone")
    .value.trim();

  const serviceType = document
    .getElementById("serviceType")
    .value;

  const priceInput = document.getElementById("price").value;
  const price = Number(priceInput);

  const address = document
    .getElementById("address")
    .value.trim();

  if (!customerName || !phone || !serviceType || priceInput === "") {
    showMessage("Please fill in all required fields.", true);
    return;
  }

  if (!Number.isFinite(price) || price < 0 || price > 1000000) {
    showMessage("Please enter a valid service price.", true);
    return;
  }

  if (!/^[0-9+\-()\s]{7,20}$/.test(phone)) {
    showMessage("Please enter a valid phone number.", true);
    return;
  }

  const newOrder = {
    id: crypto.randomUUID(),
    customerName,
    phone,
    serviceType,
    price,
    address,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);

  if (!saveOrders()) {
    orders.shift();
    return;
  }

  renderOrders();
  form.reset();
  showMessage("New service order added successfully!");
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (orders.length === 0) {
    showMessage("There are no orders to delete.", true);
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete all orders? This action cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  const previousOrders = orders;
  orders = [];

  if (!saveOrders()) {
    orders = previousOrders;
    return;
  }

  renderOrders();
  showMessage("All orders deleted successfully.");
});

document.getElementById("today").textContent =
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

renderOrders();
