const mappings = {
    "tag16h5": {
        "file_prefix": "tag16_05_",
        "viewBox": "0 0 80 80",
		"tag_size_ratio": 6/8,
		"max_id": 29
    },
    "tag25h9": {
        "file_prefix": "tag25_09_",
        "viewBox": "0 0 90 90",
		"tag_size_ratio": 7/9,
		"max_id": 34
    },
    "tag36h11": {
        "file_prefix": "tag36_11_",
        "viewBox": "0 0 100 100",
		"tag_size_ratio": 8/10,
		"max_id": 586
    },
    "tagCircle21h7": {
        "file_prefix": "tag21_07_",
        "viewBox": "0 0 90 90",
		"tag_size_ratio": 1.0,
		"max_id": 37
    },
    "tagCircle49h12": {
        "file_prefix": "tag49_12_",
        "viewBox": "0 0 110 110",
		"tag_size_ratio": 1.0,
		"max_id": 65697
    },
    "tagCustom48h12": {
        "file_prefix": "tag48_12_",
        "viewBox": "0 0 100 100",
		"tag_size_ratio": 6/10,
		"max_id": 42210
    },
    "tagStandard41h12": {
        "file_prefix": "tag41_12_",
        "viewBox": "0 0 90 90",
		"tag_size_ratio": 5/9,
		"max_id": 2114
    },
    "tagStandard52h13": {
        "file_prefix": "tag52_13_",
        "viewBox": "0 0 100 100",
		"tag_size_ratio": 6/10,
		"max_id": 48713
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
	var tagSizeInput = document.querySelector('.setup input[name=tag-size]');
	var saveButton = document.querySelector('.save-button');
	var addButton = document.querySelector('.add-button');
	var clearButton = document.querySelector('.clear-sheet');
	var sheetSection = document.querySelector('.sheet-section');
	var pagesEl = document.querySelector('.print-pages');
	var sheetCount = document.querySelector('.sheet-count');
	var pageInfo = document.querySelector('.page-info');
	var idRangeEl = document.getElementById('id-range');

	function currentFamily() {
		return familySelect.options[familySelect.selectedIndex].value;
	}

	function applyIdConstraints() {
		var fam = currentFamily();
		var max = mappings[fam].max_id;
		markerIdInput.setAttribute('min', '0');
		markerIdInput.setAttribute('max', String(max));
		if (idRangeEl) idRangeEl.textContent = '(0 \u2013 ' + max + ')';
		// Clamp current value
		var v = Number(markerIdInput.value);
		if (isNaN(v) || v < 0) v = 0;
		if (v > max) v = max;
		if (String(v) !== markerIdInput.value) markerIdInput.value = v;
	}

	// ---------- A4 packing constants (mm) ----------
	var PAGE_W = 210;
	var PAGE_H = 297;
	var MARGIN = 10;                 // page margin
	var USABLE_W = PAGE_W - 2 * MARGIN; // 190
	var USABLE_H = PAGE_H - 2 * MARGIN; // 277
	var CARD_PAD = 3;                // padding inside dashed border, around tag
	var LABEL_H = 5;                 // label height (mm)
	var GAP = 3;                     // gap between cards in mm

	// Queue of {family, id, size, svg}
	var queue = [];

	function paginate(items) {
		var pages = [];
		var curPage = [];
		var curPageH = 0;
		var curRow = [];
		var curRowW = 0;
		var curRowH = 0;

		function commitRow() {
			if (curRow.length === 0) return;
			var rowExtraH = curPage.length > 0 ? GAP : 0;
			if (curPageH + rowExtraH + curRowH > USABLE_H) {
				if (curPage.length > 0) pages.push(curPage);
				curPage = [];
				curPageH = 0;
				rowExtraH = 0;
			}
			curPageH += rowExtraH + curRowH;
			curPage.push(curRow);
			curRow = [];
			curRowW = 0;
			curRowH = 0;
		}

		items.forEach(function(item) {
			var w = item.size + 2 * CARD_PAD;
			var h = item.size + 2 * CARD_PAD + LABEL_H;
			var card = { item: item, w: w, h: h };
			var extraW = curRow.length > 0 ? GAP : 0;
			if (curRowW + extraW + w > USABLE_W) {
				commitRow();
				extraW = 0;
			}
			curRowW += extraW + w;
			curRowH = Math.max(curRowH, h);
			curRow.push(card);
		});
		commitRow();
		if (curPage.length > 0) pages.push(curPage);
		return pages;
	}

	function renderSheet() {
		pagesEl.innerHTML = '';
		var pages = paginate(queue);
		var globalIdx = 0;

		pages.forEach(function(page, pageIdx) {
			var pageEl = document.createElement('div');
			pageEl.className = 'print-page';

			var content = document.createElement('div');
			content.className = 'page-content';

			page.forEach(function(row) {
				var rowEl = document.createElement('div');
				rowEl.className = 'page-row';

				row.forEach(function(card) {
					var idx = globalIdx;
					globalIdx++;
					var item = card.item;

					var cardEl = document.createElement('div');
					cardEl.className = 'print-marker';
					cardEl.style.width = card.w + 'mm';

					var tagBox = document.createElement('div');
					tagBox.className = 'tag-box';
					tagBox.style.width = item.size + 'mm';
					tagBox.style.height = item.size + 'mm';
					tagBox.innerHTML = item.svg;
					var svg = tagBox.firstElementChild;
					if (svg) {
						svg.setAttribute('viewBox', mappings[item.family].viewBox);
						svg.setAttribute('width', item.size + 'mm');
						svg.setAttribute('height', item.size + 'mm');
						svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
					}

					var label = document.createElement('div');
					label.className = 'print-marker-label';
					label.textContent = item.family + '  ID:' + item.id + '  ' + item.size + 'mm';

					var rm = document.createElement('button');
					rm.type = 'button';
					rm.className = 'remove-btn';
					rm.title = 'Remove this tag';
					rm.innerHTML = '&times;';
					rm.addEventListener('click', function() {
						queue.splice(idx, 1);
						renderSheet();
					});

					cardEl.appendChild(tagBox);
					cardEl.appendChild(label);
					cardEl.appendChild(rm);
					rowEl.appendChild(cardEl);
				});

				content.appendChild(rowEl);
			});

			var pageNum = document.createElement('div');
			pageNum.className = 'page-number';
			pageNum.textContent = 'Page ' + (pageIdx + 1) + ' / ' + pages.length;

			pageEl.appendChild(content);
			pageEl.appendChild(pageNum);
			pagesEl.appendChild(pageEl);
		});

		sheetCount.textContent = queue.length;
		pageInfo.textContent = pages.length === 0
			? ''
			: pages.length + ' page' + (pages.length > 1 ? 's' : '');
		sheetSection.hidden = queue.length === 0;
		document.body.classList.toggle('has-queue', queue.length > 0);
	}

	addButton.addEventListener('click', function() {
		var familyName = currentFamily();
		var markerId = Number(markerIdInput.value);
		var size = Number(sizeInput.value);
		var max = mappings[familyName].max_id;
		if (isNaN(markerId) || markerId < 0 || markerId > max) {
			alert('Tag ID is out of range. ' + familyName + ' supports IDs 0 \u2013 ' + max + '.');
			return;
		}
		if (size + 2 * CARD_PAD > USABLE_W || size + 2 * CARD_PAD + LABEL_H > USABLE_H) {
			alert('Tag is too large to fit on an A4 page. Max size ≈ ' +
				(USABLE_W - 2 * CARD_PAD) + ' mm.');
			return;
		}
		getAprilTagSVGContent(familyName, markerId).then(function(content){
			queue.push({
				family: familyName,
				id: markerId,
				size: size,
				svg: content
			});
			renderSheet();
			sheetSection.scrollIntoView({behavior: 'smooth', block: 'start'});
		});
	});

	clearButton.addEventListener('click', function() {
		if (!queue.length) return;
		if (queue.length > 1 && !confirm('Remove all ' + queue.length + ' tags from the sheet?')) return;
		queue = [];
		renderSheet();
	});

	function updateSize(){
		var size = Number(sizeInput.value);
		const svgElm = document.querySelector('.preview-pane .marker').firstElementChild;
		if (!!svgElm) {
			svgElm.setAttribute('width', size + 'mm');
			svgElm.setAttribute('height', size + 'mm');
		}
	}

	familySelect.addEventListener("change", function() {
		applyIdConstraints();
		sizeInput.dispatchEvent(new Event('change'));
	});

	markerIdInput.addEventListener('input', function() {
		applyIdConstraints();
	});

	sizeInput.addEventListener("change", function() {
		var familyName = familySelect.options[familySelect.selectedIndex].value;
		tagSizeInput.value = Math.round(this.value * mappings[familyName].tag_size_ratio * 10) / 10;
		updateSize();
	});

	tagSizeInput.addEventListener("change", function() {
		var familyName = familySelect.options[familySelect.selectedIndex].value;
		sizeInput.value = Math.round(this.value / mappings[familyName].tag_size_ratio * 10) / 10;
		updateSize();
	});

	var updateTag = debounce(function() {
		var sizeid = Number(sizeInput.value);
		var markerId = Number(markerIdInput.value);
		var familyName = currentFamily();
		var max = mappings[familyName].max_id;
		var preview = document.querySelector('.preview-pane .marker');
		var label = document.querySelector('.marker-id');

		if (isNaN(markerId) || markerId < 0 || markerId > max) {
			preview.innerHTML = '<div class="tag-error">ID out of range. ' +
				familyName + ' supports IDs 0 \u2013 ' + max + '.</div>';
			label.innerHTML = '';
			saveButton.removeAttribute('href');
			saveButton.removeAttribute('download');
			return;
		}

		getAprilTagSVGContent(familyName, markerId).then(function(content){
			if (!content || content.indexOf('<svg') === -1) {
				preview.innerHTML = '<div class="tag-error">Could not load tag.</div>';
				return;
			}
			preview.innerHTML = content;
			const svgElm = preview.firstElementChild;
			svgElm.setAttribute('viewBox', mappings[familyName].viewBox);
			updateSize();
			saveButton.setAttribute('href', 'data:image/svg;base64,' + btoa(svgElm.outerHTML.replace('viewbox', 'viewBox')));
			saveButton.setAttribute('download', familyName + '-' + markerId + '.svg');
			label.innerHTML = familyName + ', ID : ' + markerId + '  Size:' + sizeid + ' mm';
		}).catch(function() {
			preview.innerHTML = '<div class="tag-error">Could not load tag (network error).</div>';
		});
	}, 200)

	applyIdConstraints();
	sizeInput.dispatchEvent(new Event('change'));
	updateTag();

	familySelect.addEventListener('change', updateTag);
	familySelect.addEventListener('input', updateTag);
	markerIdInput.addEventListener('input', updateTag);
	sizeInput.addEventListener('input', updateSize);
	sizeInput.addEventListener('input', updateTag);
}

init();
