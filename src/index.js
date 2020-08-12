const ENDPOINT = "https://en.wikipedia.org/w/api.php?origin=*&action=query"

document.getElementById("search-submit").addEventListener("click", event => {
  event.preventDefault()
  performSearch()
})

let keyTimer

document.getElementById("search-box").addEventListener("keyup", event => {
  clearTimeout(keyTimer)
  keyTimer = setTimeout(() => performSearch(), 500)
  if (event.key == "ENTER") {
    event.preventDefault()
    performSearch()
  }
})

let lastSearch

function performSearch() {
  let searchTerm = document.getElementById("search-box").value
  if (searchTerm == lastSearch) return
  clearResults()
  if (searchTerm.length == 0) {
    console.log("No search term entered")
    displayResults([], searchTerm)
    lastSearch = searchTerm
    return
  }
  let uri = encodeURI(`${ENDPOINT}&list=search&srsearch=${searchTerm}&utf8=&format=json`)
  getResults(uri)
    .then(results => displayResults(results, searchTerm)).then(res => progress(res))
  lastSearch = searchTerm

  async function getResults(uri) {
    const data = await fetch(uri)
      .then(res => res.json())
      .catch(err => console.log(err))
    let results = []
    if (data.query.searchinfo.totalhits == 0) {
      results.push({
        title: "No results",
        snippet: "Did you make a typo?",
      })
    } else {
        let i = 0
        for (let result of data.query.search) {
        progress(100 * ++i / data.query.search.length)
        let imageurl = await fetch(encodeURI(`${ENDPOINT}&pageids=${result.pageid}&format=json&prop=images`))
          .then(res => res.json())
          .then(async data => {
            let file = data.query.pages[result.pageid]
            if (file.images) {
              return await fetch(
                encodeURI(
                  `${ENDPOINT}&titles=${file.images[0].title}&format=json&prop=imageinfo&iiprop=url&iiurlwidth=200&iiurlheight=200`
                )
              )
                .then(res => res.json())
                .then(data => {
                  return data.query.pages[Object.keys(data.query.pages)[0]].imageinfo[0].thumburl
                })
            } else {
              return null
            }
          })
          .catch(error => console.log(error))
        results.push({
          title: result.title,
          snippet: result.snippet,
          pageid: result.pageid,
          img: imageurl,
        })
      }
    }
    return results
  }
}

function clearResults() {
  let resultsDiv = document.getElementById("results")
  let toRemove = []
  for (let child of resultsDiv.children) {
    if (child.id != 'progress-bar') toRemove.push(child)
  }
  for (let node of toRemove) {
    resultsDiv.removeChild(node)
  }
}
function displayResults(results, searchTerm) {
  let resultsDiv = document.getElementById("results")
  if (results.length == 0) {
    populate([{ title: "Please enter a search term", snippet: "", pageid: null }])
  } else {
    try {
      populate(results)
    } catch (error) {
      console.log(error)
    }
  }
  return "done"

  function populate(arr) {
    for (let object of arr) {
      let card = document.createElement("a")
      card.className = "card d-flex flex-row flex-wrap flex-md-nowrap justify-content-center justify-content-md-between mt-1 p-1 bg-secondary text-light"
      let href = object.pageid ? encodeURI(`https://en.wikipedia.org/wiki/Special:Redirect/page/${object.pageid}`) : "#"
      card.href = href
      if (object.img) {
        let img = document.createElement("img")
        img.className = "rounded img-thumbnail img-fluid"
        img.style = "width 100%; max-width: 100%; height: auto;"
        img.src = object.img
        card.appendChild(img)
      }
      let body = document.createElement("div")
      body.className = "card-body"
      let title = document.createElement("h3")
      title.className = "card-title"
      title.innerHTML = makeBold(searchTerm, object.title)
      let snippet = document.createElement("p")
      snippet.className = "card-text"
      snippet.innerHTML = makeBold(searchTerm, object.snippet)
      card.appendChild(body)
      body.append(title, snippet)
      resultsDiv.appendChild(card)
    }
  }
  function makeBold(term, string) {
    let match = string.match(new RegExp(term, "i"))
    if (match) {
      let idx = match.index
      let titleArr = string.split("")
      titleArr = titleArr
        .slice(0, idx)
        .concat("<strong>", titleArr.slice(idx, idx + term.length), "</strong>", titleArr.slice(idx + term.length))
      return titleArr.join("")
    } else {
      return string
    }
  }
}
function progress(value) {
  let bar = document.getElementById("progress-bar")
  if (value == 'done') {
    bar.className = "d-none"
    return
  }
  bar.className = "progress"
  bar.children[0].style.width = value + '%'
  bar.children[0].setAttribute("aria-valuenow", value)
}