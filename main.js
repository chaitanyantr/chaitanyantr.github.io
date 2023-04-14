const mappings = {
    "tag16h5": {
        "file_prefix": "tag16_05_",
        "viewBox": "0 0 80 80"
    },
    "tag25h9": {
        "file_prefix": "tag25_09_",
        "viewBox": "0 0 90 90"
    },
    "tag36h11": {
        "file_prefix": "tag36_11_",
        "viewBox": "0 0 100 100"
    },
    "tagCircle21h7": {
        "file_prefix": "tag21_07_",
        "viewBox": "0 0 90 90"
    },
    "tagCircle49h12": {
        "file_prefix": "tag49_12_",
        "viewBox": "0 0 110 110"
    },
    "tagCustom48h12": {
        "file_prefix": "tag48_12_",
        "viewBox": "0 0 100 100"
    },
    "tagStandard41h12": {
        "file_prefix": "tag41_12_",
        "viewBox": "0 0 90 90"
    },
    "tagStandard52h13": {
        "file_prefix": "tag52_13_",
        "viewBox": "0 0 100 100"
    }
}


function getAprilTagSVGContent(family, tagId) {
	// url ex : `https://raw.githubusercontent.com/chaitanyantr/apriltag/main/tag16h5/tag16_05_00000.svg`
	
	let id = tagId.toString();
	while(id.length < 5){
		id = "0" + id
	}
	const tagFileName = mappings[family].file_prefix + id + ".svg"
	const url = `https://raw.githubusercontent.com/chaitanyantr/apriltag/main/${family}/${tagFileName}`

	async function getSVGContentFromURL(url){
		const res = await fetch(url);
		const content = await res.text();
		return content
	} 
	
	return getSVGContentFromURL(url)
}

function debounce(func, ms) {
	let timeout;
	return function() {
	  clearTimeout(timeout);
	  timeout = setTimeout(() => func.apply(this, arguments), ms);
	};
  }
  
function init() {
	var familySelect = document.querySelector('.setup select[name=dict]');
	var markerIdInput = document.querySelector('.setup input[name=id]');
	var sizeInput = document.querySelector('.setup input[name=size]');
	var saveButton = document.querySelector('.save-button');
	
	function updateSize(){
		var size = Number(sizeInput.value);
		const svgElm = document.querySelector('.marker').firstElementChild
		svgElm.setAttribute('width', size + 'mm');
		svgElm.setAttribute('height', size + 'mm');
	}

	var updateTag = debounce(function() {
		var sizeid = Number(sizeInput.value);
		var markerId = Number(markerIdInput.value);
		var familyName = familySelect.options[familySelect.selectedIndex].value;
		getAprilTagSVGContent(familyName, markerId).then(function(content){
			document.querySelector('.marker').innerHTML = content;
			const svgElm = document.querySelector('.marker').firstElementChild
			svgElm.setAttribute('viewBox', mappings[familyName].viewBox);
			updateSize()
			saveButton.setAttribute('href', 'data:image/svg;base64,' + btoa(svgElm.outerHTML.replace('viewbox', 'viewBox')));
			saveButton.setAttribute('download', familyName + '-' + markerId + '.svg');
			document.querySelector('.marker-id').innerHTML = familyName + ', ID : ' +  + markerId + '  Size:' + sizeid + ' mm' ;
		})
	}, 200)

	updateTag();

	familySelect.addEventListener('change', updateTag);
	familySelect.addEventListener('input', updateTag);
	markerIdInput.addEventListener('input', updateTag);
	sizeInput.addEventListener('input', updateSize);
}

init();
