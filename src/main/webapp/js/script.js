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
            </tr>`;
    }

    $('#playersInfo').html(rowsHtml);
}

// Function to add pagination buttons
let buttonsAdder = function () {
    rowsHtml = 'Pages:';
    let pagesLimit = Math.ceil(playersCount / parseDropdown());

    for (let pageNumber = 1; pageNumber <= pagesLimit; pageNumber++) {
        rowsHtml += `<button id="page${pageNumber}">${pageNumber}</button>`;
    }

    $('#buttonsContainer').html(rowsHtml);

    currentPage = $('#page1')[0];
    currentPage.style.color = 'red';
};

// Function to handle page change and dropdown value change
let changePageContext = function(pressedButton, dropdownValueChanged) {
    if (dropdownValueChanged) {
        pressedButton = $('#page1')[0];
        currentPage = pressedButton;
    }

    $.ajax({
        url: `rest/players?pageNumber=${parseInt(pressedButton.textContent) - 1}&pageSize=${parseDropdown()}`,
        method: 'GET'
    }).done(function(data) {
        playersInformationAdder(data);

        if (dropdownValueChanged)
            buttonsAdder();
    });
}

// Initial data load
$.when(
    $.ajax('/rest/players/count'),
    $.ajax('/rest/players')
).done(function(countResponse, playersResponse) {
    playersCount = countResponse[0];
    let playersData = playersResponse[0];

    playersInformationAdder(playersData);
    buttonsAdder();
});

// Event handlers for pagination buttons and dropdown changes using the cached selector
$('#buttonsContainer').on('click', 'button', function () {
    changePageContext(this);

    if (currentPage !== this) {
        currentPage.style.color = 'black';
        currentPage = this;
        this.style.color = 'red';
    }
});

$rowsLimiter.change(function () {
    changePageContext(currentPage, true);
});
