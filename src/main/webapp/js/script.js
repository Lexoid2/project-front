let playersCount, rowsHtml, currentPage;
let $rowsLimiter = $('#rowsLimiter'); // Caching the selector for repeated use

// Function to parse the current dropdown value
let parseDropdown = () => parseInt($rowsLimiter.val());

// Function to add player information to the table
let playersInformationAdder = function (players) {
    rowsHtml = '';

    for (let player of players) {
        rowsHtml += `<tr>
                <td>${player.id}</td>
                <td>${player.name}</td>
                <td>${player.title}</td>
                <td>${player.race}</td>
                <td>${player.profession}</td>
                <td>${player.level}</td>
                <td>${new Date(player.birthday).toLocaleDateString()}</td>
                <td>${player.banned}</td>
                <td><img src="/img/edit.png" alt="Edit account" data-id="${player.id}" class="editIcon"></td>
                <td><img src="/img/delete.png" alt="Delete account" data-id="${player.id}" class="deleteIcon"></td>
            </tr>`;
    }

    $('#playersInfo').html(rowsHtml);
}

// Function to add pagination buttons
let buttonsAdder = function (stayOnCurrentPage) {
    rowsHtml = 'Pages:';
    let pagesLimit = Math.ceil(playersCount / parseDropdown());

    for (let pageNumber = 1; pageNumber <= pagesLimit; pageNumber++) {
        rowsHtml += `<button id="page${pageNumber}">${pageNumber}</button>`;
    }

    $('#buttonsContainer').html(rowsHtml);

    if (stayOnCurrentPage)
        updateCurrentPageButton($(`#page${currentPage.textContent}`)[0]);
    else
        updateCurrentPageButton($('#page1')[0]);
};

// Function to update the active pagination button
function updateCurrentPageButton(newPage, clickAnotherButton) {
    if (clickAnotherButton)
        currentPage.style.color = 'black';

    currentPage = newPage;
    currentPage.style.color = 'red';
}

// Function to handle page change and dropdown value change
let changePageContext = function(pressedButton, dropdownValueChanged, stayOnCurrentPage) {
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
    let playersData = playersResponse[0];

    playersInformationAdder(playersData);
    buttonsAdder();
});

// Event handlers for pagination buttons and dropdown changes using the cached selector
$('#buttonsContainer').on('click', 'button', function () {
    changePageContext(this);

    if (currentPage !== this)
        updateCurrentPageButton(this, true);
});

$rowsLimiter.change(function () {
    changePageContext(currentPage, true);
});

// Event handler for clicking on the delete user icon.
// Sends a request to delete an account and updates the content on the page
$('#playersInfo').on('click', '.deleteIcon', function () {
    $.ajax({
        url: `/rest/players/${$(this).data('id')}`,
        type: 'DELETE'
    }).done(function () {
        playersCount--;
        changePageContext(currentPage, false, true);
    })
});
