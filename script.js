const handleGenerateTweet = (data) => {
  let rand = getRandomInt(data.length);

  while (true) {
    if (data[rand].text.includes("http")) {
      rand = getRandomInt(data.length);
    } else {
      break;
    }
  }
  const container = document.querySelector(".twt-container");
  const body = document.querySelector(".twt-content");
  body.innerHTML = data[rand].text;

  container.classList.toggle("show");

  const time = document.querySelector(".twt-header-date");
  time.innerHTML = new Date(data[rand].datetime)
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const btn = document.querySelector(".twt-generate-btn");
  btn.addEventListener("click", () => {
    let outer = document.querySelector(".twt-container-outer");
    let prev = document.querySelector(".twt-container");
    let rand = getRandomInt(data.length);
    while (true) {
      if (data[rand].text.includes("http")) {
        rand = getRandomInt(data.length);
      } else {
        break;
      }
    }

    newElement = document.createElement("div");
    newElement.setAttribute(
      "class",
      "twt-container column-center-flex animated fadeIn"
    );
    // newElement.classList.toggle("show");
    newElement.innerHTML = `<div class="twt-header">
        <img class="twt-avatar" src="./assets/profilephoto.jpeg" />
        <b>Donald J. Trump</b>
        <p>@realDonaldTrump</p>
        <p class="twt-header-date">${new Date(data[rand].datetime)
          .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, " ")}</p>
      </div>
      <div class="twt-content-container">
        <div class="twt-content">
       ${data[rand].text}
        </div>
      </div>
      <div class="twt-footer">
        <img class="twt-footer-icon" src="./assets/Comment.svg" />
        <img class="twt-footer-icon" src="./assets/Like.svg" />
        <img class="twt-footer-icon" src="./assets/Retweet.svg" />
        <img class="twt-footer-icon" src="./assets/Share.svg" />
    </div>`;

    prev.parentElement.replaceChild(newElement, prev);
  });
};

const getRandomInt = (max) => {
  return Math.floor(Math.random() * (max - 0) + 0);
};

var STOCKTWEETS;

var ALLTWEETS;

var INFOTECH;
var CONDISC;
var HEALTH;
var ENERGY;

Plotly.d3.csv(
  "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/trump_stock_tweets.csv",
  (data) => {
    handleGenerateTweet(data);
    STOCKTWEETS = data;
  }
);

// All tweets
Plotly.d3.csv(
  "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/trump_presidential_tweets.csv",
  (data) => {
    ALLTWEETS = data.map((e) => e);

    INFOTECH = ALLTWEETS.filter(
      (e) =>
        e.text.toLowerCase().includes("technology") ||
        e.text.toLowerCase().includes("apple") ||
        e.text.toLowerCase().includes("facebook") ||
        e.text.toLowerCase().includes("google") ||
        e.text.toLowerCase().includes("amazon")
    );

    infotech();

    CONDISC = ALLTWEETS.filter(
      (e) =>
        e.text.toLowerCase().includes("general motors") ||
        e.text.toLowerCase().includes("consumer") ||
        e.text.toLowerCase().includes("discre")
    );

    condisc();

    HEALTH = ALLTWEETS.filter((e) =>
      e.text.toLowerCase().includes("healthcare")
    );

    health();

    ENERGY = ALLTWEETS.filter((e) => e.text.toLowerCase().includes("energy"));

    energy();

    data = dataCleanUp(data);

    let lookup = {};
    const getData = (year, sentiment) => {
      let byYear, trace;
      if (!(byYear = lookup[year])) {
        byYear = lookup[year] = {};
      }
      if (!(trace = byYear[sentiment])) {
        trace = byYear[sentiment] = {
          x: [],
          y: [],
          id: [],
          text: [],
          marker: { size: [] },
        };
      }
      return trace;
    };

    for (let entry of data) {
      let date = new Date(entry.datetime);
      let year = date.getFullYear();
      let month = date.getMonth();
      let day = date.getDate();
      let mondateFrac = parseInt(month) + parseInt(day) / 32;
      let sentimentCat = entry.sentiment > 0 ? "positive" : "negative";
      trace = getData(year, sentimentCat);
      trace.x.push(mondateFrac);
      trace.y.push(entry.sentiment);
      trace.id.push(entry.id);
      trace.marker.size.push(entry.size);
      trace.text.push(entry.id);
    }

    var years = Object.keys(lookup);
    var firstYear = lookup[years[0]];
    var sentimentCat = Object.keys(firstYear);
    var traces = [];
    years = years.filter((y) => y != "NaN");
    for (i = 0; i < sentimentCat.length; i++) {
      var data = firstYear[sentimentCat[i]];
      // One small note. We're creating a single trace here, to which
      // the frames will pass data for the different years. It's
      // subtle, but to avoid data reference problems, we'll slice
      // the arrays to ensure we never write any new data into our
      // lookup table:
      traces.push({
        name: sentimentCat[i],
        x: data.x.slice(),
        y: data.y.slice(),
        id: data.id.slice(),
        text: data.text.slice(),
        mode: "markers",
        marker: {
          size: data.marker.size.slice(),
          sizemode: "area",
          sizeref: 200000,
          color: sentimentCat[i] == "positive" ? "#1da1f2" : "#FF0000",
        },
        hovertemplate:
          "Sentiment: %{y} <br>" +
          "For the period: <i>%{text}</i> " +
          "<extra></extra>",
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 1, family: "PT Sans Narrow" },
          namelength: -1,
          align: "left",
        },
      });
    }
    // Create a frame for each year. Frames are effectively just
    // traces, except they don't need to contain the *full* trace
    // definition (for example, appearance). The frames just need
    // the parts the traces that change (here, the data).
    var frames = [];
    for (i = 0; i < years.length; i++) {
      frames.push({
        name: years[i],
        data: sentimentCat.map(function (sentiment) {
          return getData(years[i], sentiment);
        }),
      });
    }

    // Now create slider steps, one for each frame. The slider
    // executes a plotly.js API command (here, Plotly.animate).
    // In this example, we'll animate to one of the named frames
    // created in the above loop.
    var sliderSteps = [];
    for (i = 0; i < years.length; i++) {
      sliderSteps.push({
        method: "animate",
        label: years[i],
        args: [
          [years[i]],
          {
            mode: "immediate",
            transition: { duration: 300 },
            frame: { duration: 300, redraw: false },
          },
        ],
      });
    }
    var layout = {
      height: 500,
      width: 800,
      xaxis: {
        title: "Months",
        range: [0, 12],
      },
      yaxis: {
        title: "Sentiment",
        range: [-1, 1],
      },
      plot_bgcolor: "black",
      paper_bgcolor: "black",
      font: {
        family: "PT Sans Narrow",
        color: "#eee",
        size: 15,
      },
      legend: { orientation: "h", y: -0.175 },
      hovermode: "closest",
      // We'll use updatemenus (whose functionality includes menus as
      // well as buttons) to create a play button and a pause button.
      // The play button works by passing `null`, which indicates that
      // Plotly should animate all frames. The pause button works by
      // passing `[null]`, which indicates we'd like to interrupt any
      // currently running animations with a new list of frames. Here
      // The new list of frames is empty, so it halts the animation.
      updatemenus: [
        {
          x: 0,
          y: 0,
          yanchor: "top",
          xanchor: "left",
          showactive: false,
          direction: "left",
          type: "buttons",
          pad: { t: 100, r: 10 },
          buttons: [
            {
              method: "animate",
              args: [
                null,
                {
                  mode: "immediate",
                  fromcurrent: true,
                  transition: { duration: 1000 },
                  frame: { duration: 1000, redraw: false },
                },
              ],
              label: "Play",
            },
            {
              method: "animate",
              args: [
                [null],
                {
                  mode: "immediate",
                  transition: { duration: 0 },
                  frame: { duration: 0, redraw: false },
                },
              ],
              label: "Pause",
            },
          ],
        },
      ],
      // Finally, add the slider and use `pad` to position it
      // nicely next to the buttons.
      sliders: [
        {
          pad: { l: 130, t: 70 },
          currentvalue: {
            visible: true,
            prefix: "Year:",
            xanchor: "right",
            font: { size: 20, color: "#666" },
          },
          steps: sliderSteps,
        },
      ],
    };

    let c = document.querySelector(".graph-text-graph-container");
    // Create the plot:
    Plotly.newPlot(c, {
      data: traces,
      layout: layout,
      frames: frames,
    });
  }
);

// sp500 graph
Plotly.d3.csv(
  "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/SP500.csv",
  function (err, rows) {
    const KEYEVENTS = [
      ["2017-1-20", "Inauguration", 2271.31],
      ["2017-12-22", "Corporate tax cuts signed into law", 2683.34, -60],
      ["2018-4-2", "First round of US/China tariffs", 2581.88, 40],
      ["2019-4-18", "Mueller report released", 2905.03, -60],
      ["2019-12-18", "House impeaches Trump", 3191.14, -50],
      ["2020-1-20", "First US case of COVID-19", 3289.29, 150],
      ["2020-5-2", "Senate acquits Trump", 40],
      ["2020-8-8", "Trump expands economic relief", 3349.85, 190],
      ["2020-11-7", "Trump loses re-election bid", 3550, -70],
      ["2021-1-20", "Trump leaves office", 3800, 160],
    ];

    const annotations = KEYEVENTS.map((el, idx) => {
      let i = idx;
      if (idx > 5) {
        i = KEYEVENTS.length - idx;
      }
      let odd = true;
      if (i % 2 == 0) odd = false;
      const annotation = {
        x: el[0],
        y: el[2],
        xref: "x",
        yref: "y",
        text: el[1],
        showarrow: true,
        arrowhead: 6,
        ax: 0,
        ay: el[3] ? el[3] : -40,
        font: { color: "#1da1f2", family: "PT Sans Narrow", size: 15 },
      };
      return annotation;
    });
    function formatDate(data, annotations) {
      for (let entry of data) {
        let date = entry["DATE"].split("/");
        let newDate = `${"20" + date[2]}-${date[1]}-${date[0]}`;
        entry["DATE"] = newDate;
      }
      return data;
    }

    function unpack(rows, key) {
      return rows.map(function (row) {
        return row[key];
      });
    }

    rows = formatDate(rows, annotations);
    var trace1 = {
      type: "scatter",
      mode: "lines",
      name: "S&P 500 Price",
      x: unpack(rows, "DATE"),
      y: unpack(rows, "SP500"),
      line: { color: "#eee" },
    };

    if (!STOCKTWEETS || STOCKTWEETS.length == 0) window.location.reload();

    let stocktwt = STOCKTWEETS.map((twt) => {
      const t = twt.text;
      let text = "";
      if (t.length > 140) return;
      if (t.includes("http")) return;
      let flag = false;
      for (let i = 0; i < t.length; i++) {
        if (i % 50 == 0 && i != 0) flag = true;
        if (flag && t[i] == " ") {
          text += "<br>";
          flag = false;
        } else text += t[i];
      }
      let tmp = twt.datetime.split(" ")[0];
      tmp = tmp.split("/");
      const year = "20" + tmp[2];
      const month = tmp[1];
      const day = tmp[0];

      const date = `${year}-${month}-${day}`;

      let sp;
      for (let entry of rows) {
        let stockdate = entry["DATE"];
        if (stockdate == date) {
          sp = entry["SP500"];
        }
      }
      if (!sp) return;
      const size = Math.round(twt.sentiment * 100) / 100;

      return { text, date, size, sp };
    });
    stocktwt = stocktwt.filter((t) => t);
    var trace2 = {
      name: "Positive tweets",
      type: "scatter",
      mode: "markers",
      x: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["date"]),
      y: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["sp"]),
      text: stocktwt
        .filter((e) => parseFloat(e.size) > 0)
        .map((e) => e["text"]),
      customdata: stocktwt
        .filter((e) => parseFloat(e.size) > 0)
        .map((e) => e["size"]),
      opacity: 0.5,
      marker: {
        size: parseFloat(unpack(stocktwt, "size")) ** 4 * 500,
        sizemode: "area",
        sizeref: 200000,
        color: "#1da1f2",
      },
      hoverlabel: {
        bgcolor: "#1da1f2",
        font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
        fontsize: 1,
        namelength: -1,
        align: "left",
      },
      hovertemplate:
        "Tweet: %{text} <br>" +
        "Sentiment: <i>%{customdata}</i> " +
        "<extra></extra>",
    };
    var trace3 = {
      name: "Negative sentiment",
      type: "scatter",
      mode: "markers",
      x: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["date"]),
      y: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["sp"]),
      text: stocktwt
        .filter((e) => parseFloat(e.size) < 0)
        .map((e) => e["text"]),
      customdata: stocktwt
        .filter((e) => parseFloat(e.size) < 0)
        .map((e) => e["size"]),
      opacity: 0.5,
      marker: {
        size: parseFloat(unpack(stocktwt, "size")) ** 4 * 500,
        sizemode: "area",
        sizeref: 200000,
        color: "#FF0000",
      },
      hoverlabel: {
        bgcolor: "#1da1f2",
        font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
        namelength: -1,
        align: "left",
      },
      hovertemplate:
        "Tweet: %{text} <br>" +
        "Sentiment: <i>%{customdata}</i> " +
        "<extra></extra>",
    };

    var data = [trace1, trace2, trace3];

    var layout = {
      width: 1000,
      height: 600,
      xaxis: {
        autorange: true,
        range: ["2017-1-20", "2021-1-20"],
        rangeselector: {
          buttons: [
            {
              count: 1,
              label: "1m",
              step: "month",
              stepmode: "backward",
            },
            {
              count: 6,
              label: "6m",
              step: "month",
              stepmode: "backward",
            },
            {
              count: 12,
              label: "1y",
              step: "month",
              stepmode: "backward",
            },
            { step: "all" },
          ],
          font: {
            color: "#000",
          },
        },
        rangeslider: { range: ["2017-1-20", "2021-1-20"] },
        type: "date",
      },
      yaxis: {
        range: [1500, 4000],
        type: "linear",
        title: "Price",
      },
      plot_bgcolor: "black",
      paper_bgcolor: "black",
      font: {
        color: "#eee",
      },
      annotations: annotations,
      hovermode: "closest",
      legend: { orientation: "h", y: -0.3 },
      config: { responsive: true },
    };
    let c = document.querySelector(".sp500-graph-container");

    Plotly.newPlot(c, data, layout);
  }
);

// infotech graph
const infotech = () => {
  Plotly.d3.csv(
    "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/Information-technology-stocks.csv",
    function (err, rows) {
      function formatDate(data) {
        for (let entry of data) {
          let date = entry["Date"].split("/");
          let newDate = `${"20" + date[2]}-${date[1]}-${date[0]}`;
          entry["Date"] = newDate;
        }
        return data;
      }

      function unpack(rows, key) {
        return rows.map(function (row) {
          if (key == "color") {
            return parseFloat(row["size"]) > 0
              ? "#1da1f2"
              : parseFloat(row["size"]) < 0
              ? "#FF0000"
              : "#1da1f2";
          }
          return row[key];
        });
      }

      rows = formatDate(rows);

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: "S&P 500 Price",
        x: unpack(rows, "Date"),
        y: unpack(rows, "S&P 500"),
        line: { color: "#eee" },
      };

      if (!INFOTECH || INFOTECH.length == 0) window.location.reload();

      let stocktwt = INFOTECH.map((twt) => {
        const t = twt.text;
        let text = "";
        // if (t.length > 140) return;
        if (t.includes("http")) return;
        let flag = false;
        for (let i = 0; i < t.length; i++) {
          if (i % 50 == 0 && i != 0) flag = true;
          if (flag && t[i] == " ") {
            text += "<br>";
            flag = false;
          } else text += t[i];
        }
        let tmp = twt.datetime.split(" ")[0];
        tmp = tmp.split("-");
        const year = tmp[0];
        const month = tmp[1][0] == "0" ? tmp[1][1] : tmp[1];
        const day = tmp[2][0] == "0" ? tmp[2][1] : tmp[2];

        const date = `${year}-${month}-${day}`;
        let sp;
        for (let entry of rows) {
          let stockdate = entry["Date"];
          if (stockdate == date) {
            sp = entry["S&P 500"];
            break;
          }
        }
        if (!sp) return;
        const size = Math.round(twt.sentiment * 100) / 100;

        return { text, date, size, sp };
      });
      stocktwt = stocktwt.filter((t) => t);
      var trace2 = {
        name: "Positive tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 4 * 700,
          sizemode: "area",
          sizeref: 200000,
          color: "#1da1f2",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };
      var trace3 = {
        name: "Negatove tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 4 * 700,
          sizemode: "area",
          sizeref: 200000,
          color: "#FF0000",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };

      var data = [trace1, trace2, trace3];

      var layout = {
        height: 600,
        xaxis: {
          autorange: true,
          range: ["2017-1-20", "2021-1-20"],
          rangeselector: {
            buttons: [
              {
                count: 1,
                label: "1m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 6,
                label: "6m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 12,
                label: "1y",
                step: "month",
                stepmode: "backward",
              },
              { step: "all" },
            ],
            font: {
              color: "#000",
            },
          },
          rangeslider: { range: ["2017-1-20", "2021-1-20"] },
          type: "date",
        },
        yaxis: {
          type: "linear",
          title: "Price",
          range: [200, 2000],
        },
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: { color: "#eee", family: "PT Sans Narrow" },

        hovermode: "closest",
        legend: { orientation: "h", y: -0.3 },
        config: { responsive: true },
      };
      let c = document.querySelector(".industries-graph-container");

      Plotly.newPlot(c, data, layout);

      let btns = document.querySelectorAll(".industries-btn-item");
      let mybtn = document.getElementById("infotech");
      let txt = document.querySelector(".industries-text-container");
      mybtn.addEventListener("click", () => {
        btns.forEach((b) => {
          b.classList.remove("selected");
        });
        mybtn.classList.add("selected");
        txt.innerHTML =
          "<p>“Apple will not be given Tariff waiver, or relief, for Mac Pro parts that are made in China. Make them in the USA, no Tariffs!”</p><p>“Facebook, Google and Twitter, not to mention the Corrupt Media, are sooo on the side of the Radical Left Democrats. But fear not, we will win anyway, just like we did before! #MAGA”</p><p>Trump has critisised Apple for its global manufacturing network and social media platforms for its role in affecting political elections. Despite his remarks, Apple has risen by 123% and Facebook 61% (Krantz, 2019).</p>";
        Plotly.newPlot(c, data, layout);
      });
    }
  );
};

// consumer disc graph
const condisc = () => {
  Plotly.d3.csv(
    "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/Consumer-discretionary-stocks.csv",
    function (err, rows) {
      function formatDate(data) {
        for (let entry of data) {
          let date = entry["Date"].split("/");
          let newDate = `${"20" + date[2]}-${date[1]}-${date[0]}`;
          entry["Date"] = newDate;
        }
        return data;
      }

      function unpack(rows, key) {
        return rows.map(function (row) {
          if (key == "color") {
            return parseFloat(row["size"]) > 0
              ? "#1da1f2"
              : parseFloat(row["size"]) < 0
              ? "#FF0000"
              : "#1da1f2";
          }
          return row[key];
        });
      }

      rows = formatDate(rows);

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: "S&P 500 Price",
        x: unpack(rows, "Date"),
        y: unpack(rows, "S&P 500"),
        line: { color: "#eee" },
      };

      if (!CONDISC || CONDISC.length == 0) window.location.reload();

      let stocktwt = CONDISC.map((twt) => {
        const t = twt.text;
        let text = "";
        // if (t.length > 140) return;
        if (t.includes("http")) return;
        let flag = false;
        for (let i = 0; i < t.length; i++) {
          if (i % 50 == 0 && i != 0) flag = true;
          if (flag && t[i] == " ") {
            text += "<br>";
            flag = false;
          } else text += t[i];
        }
        let tmp = twt.datetime.split(" ")[0];
        tmp = tmp.split("-");
        const year = tmp[0];
        const month = tmp[1][0] == "0" ? tmp[1][1] : tmp[1];
        const day = tmp[2][0] == "0" ? tmp[2][1] : tmp[2];

        const date = `${year}-${month}-${day}`;
        let sp;
        for (let entry of rows) {
          let stockdate = entry["Date"];
          if (stockdate == date) {
            sp = entry["S&P 500"];
            break;
          }
        }
        if (!sp) return;
        const size = Math.round(twt.sentiment * 100) / 100;

        return { text, date, size, sp };
      });
      stocktwt = stocktwt.filter((t) => t);
      var trace2 = {
        name: "Positive tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) + 15,
          sizemode: "area",
          sizeref: 1000,
          color: "#1da1f2",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };
      var trace3 = {
        name: "Negatove tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) + 15,
          sizemode: "area",
          sizeref: 1000,
          color: "#FF0000",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };

      var data = [trace1, trace2, trace3];

      var layout = {
        height: 600,
        xaxis: {
          autorange: true,
          range: ["2017-1-20", "2021-1-20"],
          rangeselector: {
            buttons: [
              {
                count: 1,
                label: "1m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 6,
                label: "6m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 12,
                label: "1y",
                step: "month",
                stepmode: "backward",
              },
              { step: "all" },
            ],
            font: {
              color: "#000",
            },
          },
          rangeslider: { range: ["2017-1-20", "2021-1-20"] },
          type: "date",
        },
        yaxis: {
          type: "linear",
          range: [200, 2000],
          title: "Price",
        },
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: { color: "#eee", family: "PT Sans Narrow" },

        hovermode: "closest",
        legend: { orientation: "h", y: -0.3 },
        config: { responsive: true },
      };
      let c = document.querySelector(".industries-graph-container");

      let btns = document.querySelectorAll(".industries-btn-item");
      let mybtn = document.getElementById("condisc");
      let txt = document.querySelector(".industries-text-container");
      mybtn.addEventListener("click", () => {
        btns.forEach((b) => {
          b.classList.remove("selected");
        });
        mybtn.classList.add("selected");
        txt.innerHTML =
          " <p>“General Motors is very counter to what other auto, and other, companies are doing. Big Steel is opening and renovating plants all over the country. Auto companies are pouring into the U.S., including BMW, which just announced a major new plant. The U.S.A. is booming!”</p><p>        The average sentiment for Trump’s tweets related to consumer discretionary have been positive. Data suggests that his constant push towards bringing back jobs to America and comments about tariffs and tax cuts can be corellated to a rise in this sector (van den Heuvel, 2021).</p> ";
        Plotly.newPlot(c, data, layout);
      });
    }
  );
};

// health care  graph
const health = () => {
  Plotly.d3.csv(
    "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/Healthcare-stocks.csv",
    function (err, rows) {
      function formatDate(data) {
        for (let entry of data) {
          let date = entry["Date"].split("/");
          let newDate = `${"20" + date[2]}-${date[1]}-${date[0]}`;
          entry["Date"] = newDate;
        }
        return data;
      }

      function unpack(rows, key) {
        return rows.map(function (row) {
          if (key == "color") {
            return parseFloat(row["size"]) > 0
              ? "#1da1f2"
              : parseFloat(row["size"]) < 0
              ? "#FF0000"
              : "#1da1f2";
          }
          return row[key];
        });
      }

      rows = formatDate(rows);

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: "S&P 500 Price",
        x: unpack(rows, "Date"),
        y: unpack(rows, "S&P 500"),
        line: { color: "#eee" },
      };

      if (!HEALTH || HEALTH.length == 0) window.location.reload();

      let stocktwt = HEALTH.map((twt) => {
        const t = twt.text;
        let text = "";
        // if (t.length > 140) return;
        if (t.includes("http")) return;
        let flag = false;
        for (let i = 0; i < t.length; i++) {
          if (i % 50 == 0 && i != 0) flag = true;
          if (flag && t[i] == " ") {
            text += "<br>";
            flag = false;
          } else text += t[i];
        }
        let tmp = twt.datetime.split(" ")[0];
        tmp = tmp.split("-");
        const year = tmp[0];
        const month = tmp[1][0] == "0" ? tmp[1][1] : tmp[1];
        const day = tmp[2][0] == "0" ? tmp[2][1] : tmp[2];

        const date = `${year}-${month}-${day}`;
        let sp;
        for (let entry of rows) {
          let stockdate = entry["Date"];
          if (stockdate == date) {
            sp = entry["S&P 500"];
            break;
          }
        }
        if (!sp) return;
        const size = Math.round(twt.sentiment * 100) / 100;

        return { text, date, size, sp };
      });
      stocktwt = stocktwt.filter((t) => t);
      var trace2 = {
        name: "Positive tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 2 * 2500,
          sizemode: "area",
          sizeref: 200000,
          color: "#1da1f2",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };
      var trace3 = {
        name: "Negatove tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 2 * 2500,
          sizemode: "area",
          sizeref: 200000,
          color: "#FF0000",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };

      var data = [trace1, trace2, trace3];

      var layout = {
        height: 600,
        xaxis: {
          autorange: true,
          range: ["2017-1-20", "2021-1-20"],
          rangeselector: {
            buttons: [
              {
                count: 1,
                label: "1m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 6,
                label: "6m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 12,
                label: "1y",
                step: "month",
                stepmode: "backward",
              },
              { step: "all" },
            ],
            font: {
              color: "#000",
            },
          },
          rangeslider: { range: ["2017-1-20", "2021-1-20"] },
          type: "date",
        },
        yaxis: {
          type: "linear",
          title: "Price",
          range: [200, 2000],
        },
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: { color: "#eee", family: "PT Sans Narrow" },

        hovermode: "closest",
        legend: { orientation: "h", y: -0.3 },
        config: { responsive: true },
      };
      let c = document.querySelector(".industries-graph-container");

      let btns = document.querySelectorAll(".industries-btn-item");
      let mybtn = document.getElementById("health");
      let txt = document.querySelector(".industries-text-container");
      mybtn.addEventListener("click", () => {
        btns.forEach((b) => {
          b.classList.remove("selected");
        });
        mybtn.classList.add("selected");
        txt.innerHTML =
          "<p>“If our healthcare plan is approved, you will see real healthcare and premiums will start tumbling down. ObamaCare is in a death spiral!”</p>";

        txt.innerHTML +=
          "<p>The trade conflicts and Trump’s sentimental and unpredictable tweets has incited return volatitlity. Due to this uncertainty in the financial market, investors often shift towards safer assets such as the defensive stocks which include the health care sector. </p>";

        txt.innerHTML +=
          "<p>Interestingly, Trump’s COVID19 treatment has caused the healthcare index to soar after his famous “covefefe” tweet. Despite presidential health shocks rarely affecting index values based on precedents, Trump’s news has boosted healthcare stocks 2.1% in just one day (Krantz, 2020).</p>";
        Plotly.newPlot(c, data, layout);
      });
    }
  );
};

// health care  graph
const energy = () => {
  Plotly.d3.csv(
    "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/Energy-stocks.csv",
    function (err, rows) {
      function formatDate(data) {
        for (let entry of data) {
          let date = entry["Date"].split("/");
          let newDate = `${"20" + date[2]}-${date[1]}-${date[0]}`;
          entry["Date"] = newDate;
        }
        return data;
      }

      function unpack(rows, key) {
        return rows.map(function (row) {
          if (key == "color") {
            return parseFloat(row["size"]) > 0
              ? "#1da1f2"
              : parseFloat(row["size"]) < 0
              ? "#FF0000"
              : "#1da1f2";
          }
          return row[key];
        });
      }

      rows = formatDate(rows);

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: "S&P 500 Price",
        x: unpack(rows, "Date"),
        y: unpack(rows, "S&P 500"),
        line: { color: "#eee" },
      };

      if (!ENERGY || ENERGY.length == 0) window.location.reload();

      let stocktwt = ENERGY.map((twt) => {
        const t = twt.text;
        let text = "";
        // if (t.length > 140) return;
        if (t.includes("http")) return;
        let flag = false;
        for (let i = 0; i < t.length; i++) {
          if (i % 50 == 0 && i != 0) flag = true;
          if (flag && t[i] == " ") {
            text += "<br>";
            flag = false;
          } else text += t[i];
        }
        let tmp = twt.datetime.split(" ")[0];
        tmp = tmp.split("-");
        const year = tmp[0];
        const month = tmp[1][0] == "0" ? tmp[1][1] : tmp[1];
        const day = tmp[2][0] == "0" ? tmp[2][1] : tmp[2];

        const date = `${year}-${month}-${day}`;
        let sp;
        for (let entry of rows) {
          let stockdate = entry["Date"];
          if (stockdate == date) {
            sp = entry["S&P 500"];
            break;
          }
        }
        if (!sp) return;
        const size = Math.round(twt.sentiment * 100) / 100;

        return { text, date, size, sp };
      });
      stocktwt = stocktwt.filter((t) => t);
      var trace2 = {
        name: "Positive tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) > 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) > 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 2 * 250000,
          sizemode: "area",
          sizeref: 200000,
          color: "#1da1f2",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };
      var trace3 = {
        name: "Negatove tweets",
        type: "scatter",
        mode: "markers",
        x: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["date"]),
        y: stocktwt.filter((e) => parseFloat(e.size) < 0).map((e) => e["sp"]),
        text: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["text"]),
        customdata: stocktwt
          .filter((e) => parseFloat(e.size) < 0)
          .map((e) => e["size"]),
        opacity: 0.5,
        marker: {
          size: parseFloat(unpack(stocktwt, "size")) ** 2 * 250000,
          sizemode: "area",
          sizeref: 200000,
          color: "#FF0000",
        },
        hoverlabel: {
          bgcolor: "#1da1f2",
          font: { color: "#eee", size: 5, family: "PT Sans Narrow" },
          fontsize: 1,
          namelength: -1,
          align: "left",
        },
        hovertemplate:
          "Tweet: %{text} <br>" +
          "Sentiment: <i>%{customdata}</i> " +
          "<extra></extra>",
      };

      var data = [trace1, trace2, trace3];

      var layout = {
        height: 600,
        xaxis: {
          autorange: true,
          range: ["2017-1-20", "2021-1-20"],
          rangeselector: {
            buttons: [
              {
                count: 1,
                label: "1m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 6,
                label: "6m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 12,
                label: "1y",
                step: "month",
                stepmode: "backward",
              },
              { step: "all" },
            ],
            font: {
              color: "#000",
            },
          },
          rangeslider: { range: ["2017-1-20", "2021-1-20"] },
          type: "date",
        },
        yaxis: {
          type: "linear",
          title: "Price",
          range: [200, 2000],
        },
        plot_bgcolor: "black",
        paper_bgcolor: "black",
        font: { color: "#eee", family: "PT Sans Narrow" },

        hovermode: "closest",
        legend: { orientation: "h", y: -0.3 },
        config: { responsive: true },
      };
      let c = document.querySelector(".industries-graph-container");

      let btns = document.querySelectorAll(".industries-btn-item");
      let mybtn = document.getElementById("energy");
      let txt = document.querySelector(".industries-text-container");
      mybtn.addEventListener("click", () => {
        btns.forEach((b) => {
          b.classList.remove("selected");
        });
        mybtn.classList.add("selected");
        txt.innerHTML =
          "<p>“Our new American Energy Policy will unlock MILLIONS of jobs &amp, TRILLIONS in wealth. We are on the cusp of a true ene... https://t.co/w5Y7UXZSSD”</p>";

        txt.innerHTML +=
          '<p>Surprisingly, Trump’s favored S&P 500 sectors have not performed as well, as Trump has pushed for energy to create more jobs in America. However, since Trump’s inauguration, four of the 10 worst performing S&P 500 stocks are in the energy sector. Though his tweets with positive sentiment may provide a temperorary shift in the energy sector, ultimately the effect of reduced mobility patterns and economic activity due to COVID took a huge impact in the energy sector. "</p>';
        Plotly.newPlot(c, data, layout);
      });
    }
  );
};

Plotly.d3.csv(
  "https://raw.githubusercontent.com/hxyalee/monica/master/twitter/data/Sunburst%20_chart_data.csv",
  (err, data) => {
    const child = ["All<br>Industries"];
    const parents = [""];
    const values = [1100];
    const real_values = [["16.26%", "100%"]];
    for (let row of data) {
      row["Child"] = row["Child"].replaceAll(" ", "<br>");
      row["Parent"] = row["Parent"].replaceAll(" ", "<br>");
      if (row["Child"] == row["Parent"]) continue;
      if (row["value"] == "1100.00%") continue;
      let v = row["value"].split("%")[0];
      v = parseFloat(v);
      if (row["Parent"] == "All<br>Industries") {
        v = 100;
      }
      child.push(row["Child"]);
      parents.push(row["Parent"]);
      values.push(v);
      real_values.push([row["Price Return"], row["value"]]);
    }

    var pie = [
      {
        type: "sunburst",
        labels: child,
        parents: parents,
        values: values,
        leaf: {
          opacity: 0.5,
        },
        marker: {
          line: { width: 2 },
          colors: real_values.map((v) =>
            parseFloat(v[0]) > 0 ? "#1da1f2" : "#ff0000"
          ),
        },
        branchvalues: "total",
        textposition: "inside",
        textfont: { size: 15, color: "#eee", family: "PT Sans Narrow" },
        insidetextorientation: "radial",
        insidetextfont: { size: 15, color: "#eee", family: "PT Sans Narrow" },
        outsidetextfont: { size: 15, color: "#eee", family: "PT Sans Narrow" },
        customdata: real_values,
        customname: child,
        color: "#eee",
        hoverlabel: {
          font: { family: "PT Sans Narrow", size: 5, color: "#eee" },
        },
        hovertemplate:
          " Price return: %{customdata[0]} <br> Size of sector: %{customdata[1]}" +
          "<extra></extra>",
      },
    ];
    var layout = {
      margin: { l: 0, r: 0, b: 0, t: 0 },
      font: { size: 15, color: "#eee", family: "PT Sans Narrow" },
      plot_bgcolor: "black",
      paper_bgcolor: "black",
    };

    const c = document.querySelector(".pie-chart-container");
    Plotly.newPlot(c, pie, layout, { showSendToCloud: true });
  }
);

const handlenumbers = () => {
  const numcontainer = document.querySelector(".stats-container");
  const yaxis = window.pageYOffset;
  const n = numcontainer.querySelectorAll("span");
  const srtyr = n[0];
  const endyr = n[1];
  const day = n[2];
  const twt = n[3];
  const tpd = n[4];

  srtyr.innerHTML = 1800;
  endyr.innerHTML = 1800;
  day.innerHTML = 1250;
  twt.innerHTML = 16550;
  tpd.innerHTML = 0;

  var i = setInterval(() => {
    countup(srtyr);
    if (srtyr.innerHTML == "2017") clearInterval(i);
  }, 5);
  var j = setInterval(() => {
    countup(endyr);
    if (endyr.innerHTML == "2021") clearInterval(j);
  }, 10);
  var k = setInterval(() => {
    countup(day);
    if (day.innerHTML == "1468") clearInterval(k);
  }, 10);
  var l = setInterval(() => {
    countup(twt);
    if (twt.innerHTML == "16717") clearInterval(l);
  }, 20);
  var m = setInterval(() => {
    countup(tpd);
    if (tpd.innerHTML == "33") clearInterval(m);
  }, 120);
};

function countup(element) {
  const number = parseInt(element.innerHTML) + 1;
  element.innerHTML = number;
}

const handleCloud = () => {
  const container = document.querySelector(".word-cloud-content");
  const btns = document.querySelectorAll(".word-cloud-btn");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const n = document.createElement("img");
      n.setAttribute("class", "animated fadeIn");
      btns.forEach((bt) => bt.classList.remove("selected"));
      b.classList.add("selected");
      if (b.innerHTML == "2017") n.setAttribute("src", "./assets/1.svg");
      if (b.innerHTML == "2018") n.setAttribute("src", "./assets/2.svg");
      if (b.innerHTML == "2019") n.setAttribute("src", "./assets/3.svg");
      if (b.innerHTML == "2020") n.setAttribute("src", "./assets/4.svg");
      container.replaceChild(n, container.firstElementChild);
    });
  });
};

handleCloud();
