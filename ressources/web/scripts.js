tvShows = ["Suits", "The Big Bang Theory", "Shooter", "The Good Doctor", "Westworld", "Billions", "Silicon Valley", "McMafia", "The Walking Dead", "Banshee", "Mr Robot", "How I Met Your Mother", "Young Sheldon", "Rick and Morty", "American Gods", "Mentalist", "Room 104", "The Strain", "Narcos", "Game Of Thrones", "Sherlock", "Strike Back", "Ozark", "Hannibal", "Prison Break", "11.22.63", "Better Call Saul", "The Night Manager", "Big Little Lies", "The Night Of", "Legion", "Fear the Walking Dead", "Marvel's Daredevil", "Person of Interest", "Limitless", "House of Cards", "Fargo", "Blue Mountain State", "Breaking Bad", "Under the Dome", "Lie to Me", "Lost", "House", "Arrow", "Flash", "Power"];

function randomNumber(size) {
	var r = Math.floor((Math.random() * 1000) + 1) % size;
	return (r);
}

function	addBox(imgURL, link) {
	var newBox = document.createElement('a');
	newBox.classList.add('size');
	newBox.style.backgroundImage = imgURL; //Add the artwork as cover
	newBox.href = link; //Add the link to the tvShow
	newBox.target = "_blank";
	document.body.appendChild(newBox);
}

function	downloadArtwork(name) {
	var request = new XMLHttpRequest();
	var url = "https://itunes.apple.com/search?term=NAME&country=us&entity=tvSeason&limit=15";
	var newurl = url.replace("NAME", name);
	request.open('GET', newurl);
	request.onreadystatechange = function () {
		if (this.readyState === 4) {
			var data = JSON.parse(this.response);

			var i = -1;
			while (data.results[++i].collectionName && data.results[i].collectionName.includes("Season ") && data.results[i].artistId == data.results[0].artistId) {
				url = data.results[i].artworkUrl100;
				newURL = url.replace("100x100", "600x600");
				var imgURL = "url(\"" + newURL + "\")";
				link = data.results[i].collectionViewUrl;
				addBox(imgURL, link);
			}
		}
	};
	request.send();
};

function	chooseShows() {
	var textArea = document.getElementById('info');
	var tvShow = textArea.value.replace(' ', '_');
	if (tvShow) {
		textArea.value = "";
		var tvShowArray = tvShow.split(/(?:,|;)+/);
		for (var j = 0; j < tvShowArray.length; j++)
			var i = downloadArtwork(tvShowArray[j]);
	}
	else
		alert("Add a TV Shows");
}

function getArtwork() {
	for (var j = 0; j < tvShows.length; j++)
		var i = downloadArtwork(tvShows[j]);
}

function shuffle() {
	var boxes = document.getElementsByTagName('a');

	for (var i = 0; i < boxes.length; i++) {
		var num = randomNumber(boxes.length);
		var num2 = randomNumber(boxes.length);
		var tmpImage = boxes[num].style.backgroundImage;
		var tmpLink = boxes[num].href;
		boxes[num].style.backgroundImage = boxes[num2].style.backgroundImage;
		boxes[num].href = boxes[num2].href
		boxes[num2].style.backgroundImage = tmpImage;
		boxes[num2].href = tmpLink;
	};
}

document.addEventListener('DOMContentLoaded', function(){
	getArtwork();
	document.addEventListener('DOMNodeInserted', shuffle);
	var i = 0;
	document.addEventListener('DOMSubtreeModified', function() {
		if (i == 0) {
			animateCover();
			i = 1;
		};
	});
});


function animateCover() {
	var timeout;
	var delay = 4000;

	reverse()
	function reverse() {
		mix();
		timeout = setTimeout(reverse, delay);
	};
};

function mix() {
	var boxes = document.getElementsByTagName('a');
	var num = randomNumber(boxes.length);
	var num2 = randomNumber(boxes.length);
	var tmpImage = boxes[num].style.backgroundImage;

	var tmpLink = boxes[num].href;
	boxes[num].classList.add('reverse');
	boxes[num2].classList.add('reverse');
	boxes[num].style.backgroundImage = boxes[num2].style.backgroundImage;
	boxes[num].href = boxes[num2].href
	boxes[num2].style.backgroundImage = tmpImage;
	boxes[num2].href = tmpLink;
}
