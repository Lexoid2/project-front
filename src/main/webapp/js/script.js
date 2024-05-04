let playersCount, rowsHtml, currentPage,
    editedElement, isEditedModeEnabled = false;

// Caching the selectors for repeated use
const $rowsLimiter = $('#rowsLimiter');
const $playersInfo = $('#playersInfo');
const $buttonsContainer = $('#buttonsContainer');
const $saveButton = $('#saveButton');

// Function to parse the current dropdown value
function parseDropdown() {
    return parseInt($rowsLimiter.val());
}

// Function to add player information to the table
function playersInformationAdder(players) {
    rowsHtml = '';

    for (const player of players) {
        rowsHtml += `<tr>
                <td>${player.id}</td>
                <td class="name">${player.name}</td>
                <td class="title">${player.title}</td>
                <td class="race">${player.race}</td>
                <td class="profession">${player.profession}</td>
                <td>${player.level}</td>
                <td>${new Date(player.birthday).toLocaleDateString()}</td>
                <td class="banned">${player.banned}</td>
                <td><img src="/img/edit.png" alt="Edit account" data-id="${player.id}" class="editIcon"></td>
                <td><img src="/img/delete.png" alt="Delete account" data-id="${player.id}" class="deleteIcon"></td>
            </tr>`;
    }

    $playersInfo.html(rowsHtml);
}

// Function to add pagination buttons
function buttonsAdder(stayOnCurrentPage) {
    rowsHtml = 'Pages:';
    const pagesLimit = Math.ceil(playersCount / parseDropdown());

    for (let pageNumber = 1; pageNumber <= pagesLimit; pageNumber++) {
        rowsHtml += `<button id="page${pageNumber}" class="pageButton">${pageNumber}</button>`;
    }

    $buttonsContainer.html(rowsHtml);

    if (stayOnCurrentPage)
        updateCurrentPageButton($(`#page${currentPage.textContent}`)[0]);
    else
        updateCurrentPageButton($('#page1')[0]);
}

// Function to update the active pagination button
function updateCurrentPageButton(newPage, clickAnotherButton) {
    if (clickAnotherButton)
        currentPage.style.color = 'black';

    currentPage = newPage;
    currentPage.style.color = 'red';
}

// Function to handle page change and dropdown value change
function changePageContext(pressedButton, dropdownValueChanged, stayOnCurrentPage) {
    if (dropdownValueChanged) {
        pressedButton = $('#page1')[0];
        currentPage = pressedButton;
    }

    $.get('rest/players', {
        pageNumber: `${parseInt(pressedButton.textContent) - 1}`,
        pageSize: `${parseDropdown()}`
    }).done(function(data) {
        if (data.length !== 0)
            playersInformationAdder(data);
        else {
            updateCurrentPageButton($(`#page${parseInt(currentPage.textContent) - 1}`)[0]);
            changePageContext(currentPage, false, true);
            return;
        }

        if (dropdownValueChanged)
            buttonsAdder();
        else if (stayOnCurrentPage)
            buttonsAdder(stayOnCurrentPage);
    });
}

// Initial data load
$.when(
    $.get('/rest/players/count'),
    $.get('/rest/players')
).done(function(countResponse, playersResponse) {
    playersCount = countResponse[0];
    const playersData = playersResponse[0];

    playersInformationAdder(playersData);
    buttonsAdder();
});

// Event handlers for pagination buttons and dropdown changes using the cached selector
$buttonsContainer.on('click', 'button', function () {
    isEditedModeEnabled = false;
    changePageContext(this);

    if (currentPage !== this)
        updateCurrentPageButton(this, true);
});

$rowsLimiter.change(function () {
    changePageContext(currentPage, true);
});

// Event handler for clicking on the delete user icon.
// Sends a request to delete an account and updates the content on the page
$playersInfo.on('click', '.deleteIcon', function () {
    if (isEditedModeEnabled) {
        showPopup($('#popupDeletionWarning')[0]);
        return;
    }

    $.ajax({
        url: `/rest/players/${$(this).data('id')}`,
        type: 'DELETE'
    }).done(function () {
        playersCount--;
        changePageContext(currentPage, false, true);
    })
});

// Event handler for clicking on the edit user icon.
// Activates the account editing mode, makes it possible to send data to the server by double-clicking on the icon
$playersInfo.on('click', '.editIcon', function () {
    const dataId = $(this).data('id');

    if (!isEditedModeEnabled) {
        isEditedModeEnabled = true;
        editedElement = this;
    } else if (this === editedElement) {
        const elementsData = [];

        $('.edited').each(function () {
            elementsData.push($(this).val());
        });

        updateData(dataId, JSON.stringify({
            'name': elementsData[0],
            'title': elementsData[1],
            'race': elementsData[2].toUpperCase(),
            'profession': elementsData[3].toUpperCase(),
            'banned': elementsData[4]
        }));

        return;
    } else {
        showPopup($('#popupEditWarning')[0]);
        return;
    }

    this.src = '/img/save.png';
    $(`.deleteIcon[data-id="${dataId}"]`)[0].style.display = 'none';

    $(this).parent().siblings().html(function (_, oldHtml) {

        // Function that constructs HTML code for dropdown lists
        const dropDownListBuilder = function (value) {
            const firstPart = `<option value="${value.toLowerCase()}"`;
            const secondPart = `>${value}</option>`;

            if (value === oldHtml)
                return firstPart + ' selected' + secondPart;
            else
                return firstPart + secondPart;
        };

        switch (this.className) {
            case 'name':
                return '<label for="editableName" class="visually-hidden">Enter a name to edit:</label>' +
                `<input id="editableName" class="edited" type="text" minlength="1" maxlength="12" value="${oldHtml}">`;
            case 'title':
                return '<label for="editableTitle" class="visually-hidden">Enter title to edit:</label>' +
                `<input id="editableTitle" class="edited" type="text" minlength="1" maxlength="30" value="${oldHtml}">`;
            case 'race':
                return '<label for="editableRace" class="visually-hidden">Select race:</label>' +
                '<select id="editableRace" class="edited">' +
                    dropDownListBuilder('HUMAN') +
                    dropDownListBuilder('DWARF') +
                    dropDownListBuilder('ELF') +
                    dropDownListBuilder('GIANT') +
                    dropDownListBuilder('ORC') +
                    dropDownListBuilder('TROLL') +
                    dropDownListBuilder('HOBBIT') +
                '</select>';
            case 'profession':
                return '<label for="editableProfession" class="visually-hidden">Select profession:</label>' +
                '<select id="editableProfession" class="edited">' +
                    dropDownListBuilder('WARRIOR') +
                    dropDownListBuilder('ROGUE') +
                    dropDownListBuilder('SORCERER') +
                    dropDownListBuilder('CLERIC') +
                    dropDownListBuilder('PALADIN') +
                    dropDownListBuilder('NAZGUL') +
                    dropDownListBuilder('WARLOCK') +
                    dropDownListBuilder('DRUID') +
                '</select>';
            case 'banned':
                return '<label for="editableBanInfo" class="visually-hidden">Select ban status:</label>' +
                '<select id="editableBanInfo" class="edited">' +
                    dropDownListBuilder('false') +
                    dropDownListBuilder('true') +
                '</select>';
        }
    });
});

// A function that sends a POST request to the server and updates the selected account data
function updateData(id, data) {
    $.ajax({
        url: `/rest/players/${id}`,
        contentType: 'application/json',
        type: 'POST',
        data: data
    }).done(function() {
        changePageContext(currentPage);
        isEditedModeEnabled = false;
    }).fail(function () {
        showPopup($('#popupEditError')[0]);
    });
}

// A function that creates a new account by sending a POST request to the server
// when the corresponding button is clicked
$saveButton.click(function () {
    $.ajax({
        url: '/rest/players/',
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify({
            'name': $('#setName').val(),
            'title': $('#setTitle').val(),
            'race': $('#setRace').val().toUpperCase(),
            'profession': $('#setProfession').val().toUpperCase(),
            'birthday': new Date($('#setBirthday').val()).getTime(),
            'banned': Boolean($('#setBanInfo').val()),
            'level': Number($('#setLevel').val())
        })
    }).done(function () {
        changePageContext(currentPage);
        buttonsAdder(true);
        playersCount++;
    }).fail(function () {
        showPopup($('#popupCreateError')[0]);
    });
});

// Shows a pop-up window with error or warning information
function showPopup(element) {
    element.style.display = 'block';

    setTimeout(function() {
        element.style.display = 'none';
    }, 3000);
}
