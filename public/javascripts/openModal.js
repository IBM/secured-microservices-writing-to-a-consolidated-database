// Copyright 2018 IBM Corp. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You
// may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.


$(document).ready(function() {
  // Get the modal
  var numRows = 0;
  var modal = document.getElementById('myModal');

  var mytable = document.getElementById("entriesTable");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  $('#entriesTable tbody tr').on('click', function (event) {
    console.log($(this).attr('id'));
    let entryId = $(this).attr('id');

    $.get('/entries', {id: entryId}, function (data) {
        $('#modalAlert').hide();

        let name = data.name;
        let dob = data.dob;
        let gender = data.gender;
        let phone = data.phone;
        let email = data.email;
        let decName = data.decName;

        let rowHtml = '<tr><td>' + name +'</td><td>' + dob + '</td><td>' + gender + '</td><td>' + phone + '</td><td>' + email + '</td></tr>';
        if (numRows < 1) {
          numRows++;
          $('#clearTextTable tbody').append(rowHtml);
        }

        if(!name) {
          $('#modalAlert').html('Error: Row does not exist');
          $('#modalAlert').show();
          $('#clearTextTable').hide();
        } else if(name === decName) {
          $('#clearTextTable').show();
        }else{
          $('#clearTextTable').show();
          $('#modalAlert').html('Error: Incorrect DEK used to decrypt data');
          $('#modalAlert').show();
        }


      }).fail(function (error) {
        let data = error.responseJSON.myObj;
        let name = data.name;
        let dob = data.dob;
        let gender = data.gender;
        let phone = data.phone;
        let email = data.email;

        let rowHtml = '<tr><td>' + name +'</td><td>' + dob + '</td><td>' + gender + '</td><td>' + phone + '</td><td>' + email + '</td></tr>';
        if (numRows < 1) {
          numRows++;
          $('#clearTextTable tbody').append(rowHtml);
        }

        $('#modalAlert').html(error.responseJSON.errorMsg);
        $('#modalAlert').show();
        $('#clearTextTable').show();
      }).always(function () {
        modal.style.display = "block";
      });
  });

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
    document.getElementById("clearTextTable").deleteRow(1);
    numRows--;
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      document.getElementById("clearTextTable").deleteRow(1);
      numRows--;
    }
  }
});
