var Vue = require('vue')
var request = require('browser-request')
var _ = require('lodash')
var gMap = require('../../services/map')
var productMarkers = []
var markers = []
// var map = gMap.create(document.getElementById('search_map'), gMap.coords(44.099421, -79.793701))
var map = new GMaps({
  div: '#search_map',
  lat: '43.7182412',
  lng: '-79.378058',
  zoom: 11
})
var gettingProducts = false
var page = 1
var cityName = ''
var dates = {
  from: '',
  to: ''
}

var tagsList = []

GMaps.geolocate({
  success: function (position) {
    map.setCenter(position.coords.latitude, position.coords.longitude)
    map.addMarker({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      icon: '/map/home.png'
    })
  },
  error: function (error) {
    alert('Geolocation failed: ' + error.message)
  },
  not_supported: function () {
    alert('Your browser does not support geolocation')
  }
})

var getProducts = function (page) {
  // clearMarkers()
  gettingProducts = true
  request({
    uri: '/api/products?' + generateRequestBody(page),
    json: true
  }, function (err, response, prods) {
    if (err) {
      return console.error(err)
    }

    var template = document.getElementsByClassName('map-pointi')[0].innerHTML

    prods.products.forEach(function (product, index) {
      var options = {
        content: template.replace(/IMAGE_URL/g, product.image).replace(/TITLE/g, product.title).replace(/PRICE/g, '$' + product.price_per_day).replace(/ID/g, product.id),
        position: gMap.coords(product.map.lat, product.map.long)
      }
      var iwindow = gMap.infoWindow(map, options).onClose(function () {})
      addMarker(product, iwindow)

      productMarkers.push(iwindow)
      v.$data.products.push(product)
    })

    // var template = document.getElementsByClassName('map-pointi')[0].innerHTML
    // prods.products.forEach(function (product, index) {
    //   var options = {
    //     content: template.replace(/IMAGE_URL/g, product.image).replace(/TITLE/g, product.title).replace(/PRICE/g, '$' + product.price_per_day).replace(/ID/g, product.id),
    //     position: gMap.coords(product.map.lat, product.map.long)
    //   }
    //   var iwindow = gMap.infoWindow(map, options).onClose(function () {
    //     v.$data.products[index].active = false
    //   })
    //   productMarkers.push(iwindow)
    //   product.active = false
    //   v.$data.products.push(product)
    // })
    if (prods.products.length) {
      gettingProducts = false
    }
  })
}

// Add a marker to the map and push to the array.
function addMarker (product, iwindow) {
  map.addMarker({
    lat: product.map.lat,
    lng: product.map.long,
    title: product.title,
    icon: '/map/marker.png',
    click: function (e) {
      this.setVisible(false)
      iwindow.open(map, this).onClose(function () {
        // v.$data.products[index].active = false
        this.setVisible(true)
      })
    }
  })

  // var marker = new google.maps.Marker({
  //   position: location,
  //   map: map
  // })
  markers.push(this)
}

// Sets the map on all markers in the array.
function setAllMap (map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map)
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers () {
  setAllMap(null)
}

var generateRequestBody = function (page) {
  var _return = 'page=' + page

  if (v.$data.category.id > 0) {
    _return += '&search[category_id]=' + v.$data.category.id
  }

  if (Object.keys(v.$data.tags.active).length) {
    _return += '&search[tag_id]=' + v.$data.tags.active.id
  }

  var priceRange = range.val().split(',')

  _return += '&search[price_min]=' + priceRange[0] + '&search[price_max]=' + priceRange[1]

  if (cityName.length) {
    _return += '&search[locality]=' + cityName
  }

  if (dates.from !== '' && dates.to !== '') {
    _return += '&search[start_date]=' + dates.from + '&search[end_date]=' + dates.to
  }

  return _return
}
var filter = function () {
  gettingProducts = false
  page = 1

  v.$data.products = []
  productMarkers.forEach(function (marker) {
    marker.close()
  })
  productMarkers = []

  getProducts(page)
}

var v = new Vue({
  el: '#lenyt-search',
  data: {
    products: [],
    category: {
      name: '',
      id: 0
    },
    tags: {
      searchTerm: '',
      visible: false,
      list: [],
      current: -1,
      active: {},
      placeholder: 'what'
    },
    city: {
      search: '',
      visible: false,
      list: [
        {
          name: 'Please type more...'
        }
      ]
    },
    datePicker: {
      visible: false
    }
  },
  methods: {
    toggleActive: function (e) {
      var element = e.target
      while (element.dataset.index === undefined && element !== document.body) {
        element = element.parentNode
      }
      var index = +element.dataset.index
      v.$data.products[index].active = !v.$data.products[index].active
      if (v.$data.products[index].active) {
        productMarkers[index].open(map)
      } else {
        productMarkers[index].close()
      }
    },
    scroll: function (e) {
      if (e.target.scrollTop + 700 > e.target.scrollHeight && !gettingProducts) {
        getProducts(++page)
      }
    },
    selectCategory: function (id, name) {
      v.$data.category.name = name
      v.$data.category.id = id
      filter()
    },
    selectTag: function (index) {
      selectTag(index)
    },
    deSelectTag: function () {
      v.$data.tags.active = {}
      v.$data.tags.placeholder = 'what'
      v.$data.tags.searchTerm = ''
      document.getElementById('tag-input').blur()
      filter()
    },
    hideTags: function () {
      setTimeout(function () {
        v.$data.tags.visible = false
      }, 400)
    },
    hideCity: function () {
      setTimeout(function () {
        v.$data.city.visible = false
      }, 400)
    },
    findTags: function (e) {
      if (e.keyCode === 40) {
        v.$data.tags.current++
        if (v.$data.tags.current === v.$data.tags.list.length) {
          v.$data.tags.current--
        }
        return
      }
      if (e.keyCode === 38) {
        v.$data.tags.current--
        if (v.$data.tags.current < 0) {
          v.$data.tags.current = 0
        }
        return
      }
      if (e.keyCode === 13) {
        selectTag(v.$data.tags.current)
      }
      v.$data.tags.current = -1
      v.$data.tags.list = tagsList.filter(function (tag) {
        return tag.name.match(v.$data.tags.searchTerm)
      })
    },
    findCity: function () {
      v.$data.city.list = [
        {
          name: 'Loading...'
        }
      ]
      clearTimeout(cityTimer)
      cityTimer = setTimeout(findCity, 300)
    },
    setCity: function (name) {
      if (name.match(/\.\.\./)) {
        cityName = ''
      } else {
        v.$data.city.search = name
        cityName = name
      }
      filter()
    },
    disableDates: function () {
      v.$data.datePicker.visible = false
      dates.from = ''
      dates.to = ''
      filter()
    }
  }
})

request({
  uri: '/api/tags',
  json: true
}, function (err, response, data) {
  if (err) {
    throw err
  }
  tagsList = data.tags
  v.$data.tags.list = _.cloneDeep(tagsList)
})

var selectTag = function (index) {
  v.$data.tags.active = _.cloneDeep(v.$data.tags.list[index])
  v.$data.tags.placeholder = v.$data.tags.active.name
  v.$data.tags.searchTerm = ''
  document.getElementById('tag-input').blur()
  filter()
}

var range = window.jQuery('#range').slider({
  tooltip: 'hide'
})

var sliderTimer = setTimeout(function () {})
var cityTimer = setTimeout(function () {})

range.on('slide', function () {
  clearTimeout(sliderTimer)

  sliderTimer = setTimeout(afterSlide, 150)
  values = $('input#range').val().split(',')
  min = values[0]
  max = values[1]
  if (max === '1000') {
    max = '1000+'
  }

  jQuery('div.start_range').html(min)
  jQuery('div.end_range').html(max)
})

var afterSlide = function () {
  filter()
}
var findCity = function () {
  request({
    uri: '/api/cities?name=' + v.$data.city.search,
    json: true
  }, function (err, response, data) {
    if (err) {
      throw err
    }

    v.$data.city.list = data.cities
  })
}

getProducts(page)

// window.jQuery('#range-pick').dateRangePicker({
//   format: 'YYYY-MM-DD',
//   inline: true,
//   alwaysOpen: true,
//   setValue: function (s, s1, s2) {
//     v.$data.datePicker.visible = false
//     dates.from = s1
//     dates.to = s2
//     filter()
//   },
//   container: '#range-pick'
// })

window.jQuery('.input-daterange').each(function () {
  jQuery(this).datepicker({
    format: 'yyyy-mm-dd',
    startDate: new Date(),
    clearBtn: true,
    maxViewMode: 'days'
  })
})
