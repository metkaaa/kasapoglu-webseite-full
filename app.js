const TOTAL_VAPES = 160;
const TOTAL_COST = 980;
const COST_PER_VAPE = TOTAL_COST / TOTAL_VAPES; // 6.125 €

const state = {
  activeProfile: null,
  profiles: {
    Aron: {
      sales: [],
      totalUnits: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
    },
    Mehmet: {
      sales: [],
      totalUnits: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
    },
  },
};

const costPerVapeEl = document.getElementById("costPerVape");
const profileSelectSection = document.getElementById("profile-select");
const dashboardSection = document.getElementById("dashboard");
const activeProfileNameEl = document.getElementById("activeProfileName");
const activeProfileAvatarEl = document.getElementById("activeProfileAvatar");
const changeProfileBtn = document.getElementById("changeProfileBtn");
const saleForm = document.getElementById("saleForm");
const salePriceInput = document.getElementById("salePrice");
const saleQuantityInput = document.getElementById("saleQuantity");
const statsProfileNameEl = document.getElementById("statsProfileName");
const statUnitsEl = document.getElementById("statUnits");
const statRevenueEl = document.getElementById("statRevenue");
const statCostEl = document.getElementById("statCost");
const statProfitEl = document.getElementById("statProfit");

let revenueChart;
let profitChart;
let unitsComparisonChart;
let profitComparisonChart;

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(value);
}

function initCostInfo() {
  if (costPerVapeEl) {
    costPerVapeEl.textContent = `${formatCurrency(COST_PER_VAPE)} (≈ ${formatCurrency(
      Math.round(COST_PER_VAPE * 100) / 100
    )})`;
  }
}

function setActiveProfile(name) {
  state.activeProfile = name;

  profileSelectSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  activeProfileNameEl.textContent = name;
  activeProfileAvatarEl.textContent = name[0] || "?";
  activeProfileAvatarEl.classList.toggle("avatar-aron", name === "Aron");
  activeProfileAvatarEl.classList.toggle("avatar-mehmet", name === "Mehmet");

  statsProfileNameEl.textContent = name;

  if (!revenueChart) {
    initCharts();
  }

  updateStats();
  updateCharts();
}

function resetToProfileSelection() {
  state.activeProfile = null;
  dashboardSection.classList.add("hidden");
  profileSelectSection.classList.remove("hidden");
}

function handleSaleSubmit(event) {
  event.preventDefault();
  if (!state.activeProfile) return;

  const price = parseFloat(salePriceInput.value.replace(",", "."));
  const qty = parseInt(saleQuantityInput.value, 10);

  if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
    alert("Bitte gültigen Verkaufspreis und Menge eingeben.");
    return;
  }

  const profile = state.profiles[state.activeProfile];
  const revenue = price * qty;
  const cost = COST_PER_VAPE * qty;
  const profit = revenue - cost;

  profile.sales.push({
    price,
    qty,
    revenue,
    cost,
    profit,
    timestamp: new Date(),
  });

  profile.totalUnits += qty;
  profile.totalRevenue += revenue;
  profile.totalCost += cost;
  profile.totalProfit += profit;

  saleForm.reset();
  saleQuantityInput.value = "1";

  updateStats();
  updateCharts();
}

function updateStats() {
  if (!state.activeProfile) return;
  const profile = state.profiles[state.activeProfile];

  statUnitsEl.textContent = formatNumber(profile.totalUnits);
  statRevenueEl.textContent = formatCurrency(profile.totalRevenue);
  statCostEl.textContent = formatCurrency(profile.totalCost);
  statProfitEl.textContent = formatCurrency(profile.totalProfit);

  statProfitEl.classList.toggle("negative", profile.totalProfit < 0);
  statProfitEl.classList.toggle("positive", profile.totalProfit >= 0);
}

function initCharts() {
  const revenueCtx = document.getElementById("revenueChart").getContext("2d");
  const profitCtx = document.getElementById("profitChart").getContext("2d");
  const unitsComparisonCtx =
    document.getElementById("unitsComparisonChart").getContext("2d");
  const profitComparisonCtx =
    document.getElementById("profitComparisonChart").getContext("2d");

  revenueChart = new Chart(revenueCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Umsatz",
          data: [],
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  });

  profitChart = new Chart(profitCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Gewinn",
          data: [],
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  });

  unitsComparisonChart = new Chart(unitsComparisonCtx, {
    type: "bar",
    data: {
      labels: ["Aron", "Mehmet"],
      datasets: [
        {
          label: "Verkaufte Vapes",
          data: [0, 0],
          backgroundColor: ["#4f46e5", "#0ea5e9"],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  profitComparisonChart = new Chart(profitComparisonCtx, {
    type: "bar",
    data: {
      labels: ["Aron", "Mehmet"],
      datasets: [
        {
          label: "Gesamtgewinn",
          data: [0, 0],
          backgroundColor: ["#16a34a", "#22c55e"],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  });
}

function updateCharts() {
  if (!state.activeProfile) return;
  const profile = state.profiles[state.activeProfile];

  const labels = profile.sales.map((sale, index) => `Verkauf ${index + 1}`);
  const revenueData = profile.sales.map((sale) => sale.revenue);
  const profitData = profile.sales.map((sale) => sale.profit);

  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = revenueData;
  revenueChart.update();

  profitChart.data.labels = labels;
  profitChart.data.datasets[0].data = profitData;
  profitChart.update();

  const aron = state.profiles.Aron;
  const mehmet = state.profiles.Mehmet;

  unitsComparisonChart.data.datasets[0].data = [
    aron.totalUnits,
    mehmet.totalUnits,
  ];
  unitsComparisonChart.update();

  profitComparisonChart.data.datasets[0].data = [
    aron.totalProfit,
    mehmet.totalProfit,
  ];
  profitComparisonChart.update();
}

function setupProfileCards() {
  document.querySelectorAll(".profile-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const profileName = btn.getAttribute("data-profile");
      setActiveProfile(profileName);
    });
  });
}

function setupEvents() {
  setupProfileCards();

  changeProfileBtn.addEventListener("click", () => {
    resetToProfileSelection();
  });

  saleForm.addEventListener("submit", handleSaleSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  initCostInfo();
  setupEvents();
});

