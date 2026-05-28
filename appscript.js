function doGet(e) {
  Logger.log(JSON.stringify(e));
  var result = 'OK';
  if (e.parameter == 'undefined') {
    result = 'No_Parameters';
  }
  else {
    var sheet_id = 'replace this with your sheet id'; 	// Spreadsheet ID.
    var sheet_UD = 'User_Data';  // Sheet name for user data.
    var sheet_AT = 'Entry';  // Sheet name for attendance.

    var sheet_open = SpreadsheetApp.openById(sheet_id);
    var sheet_user_data = sheet_open.getSheetByName(sheet_UD);
    var sheet_attendence = sheet_open.getSheetByName(sheet_AT);
    var sts_val = "";
    var uid_val = "";
    var hid_val = "";
    var uid_column = "B";
    var TI_val = "";
    var Date_val = "";

    for (var param in e.parameter) {
      Logger.log('In for loop, param=' + param);
      var value = stripQuotes(e.parameter[param]);
      Logger.log(param + ':' + e.parameter[param]);
      switch (param) {
        case 'sts':
          sts_val = value;
          break;

        case 'uid':
          uid_val = value;
          break;

        case 'hid':
          hid_val = value;
          break;

        default:
        // result += ",unsupported_parameter";
      }
    }
    //----------------------------------------

    //----------------------------------------Conditions for registering new users.
    if (sts_val == 'reg') {
      var check_new_UID = checkUID(sheet_id, sheet_UD, 2, uid_val);
      if (check_new_UID == true) {
        result += ",regErr01"; // Err_01 = UID is already registered.
        return ContentService.createTextOutput(result);
      }
      var getLastRowUIDCol = findLastRow(sheet_id, sheet_UD, uid_column);
      var newUID = sheet_open.getRange(uid_column + (getLastRowUIDCol + 1));
      newUID.setValue(uid_val);
      result += ",R_Successful";
      return ContentService.createTextOutput(result);
    }

    if (sts_val == 'atc') {
      var FUID = findUID(sheet_id, sheet_UD, 2, uid_val);
      if (FUID == -1) {
        result += ",atcErr01"; // atcErr01 = UID not registered.
        return ContentService.createTextOutput(result);
      }

      else {
        var get_Range = sheet_user_data.getRange("A" + (FUID + 2));
        var user_name_by_UID = get_Range.getValue();
        var enter_data = "time_in";
        var num_row;
        var Curr_Date = Utilities.formatDate(new Date(), "Asia/Dhaka", 'dd/MM/yyyy');
        var Curr_Time = Utilities.formatDate(new Date(), "Asia/DHAKA", 'HH:mm:ss');
        var data = sheet_attendence.getDataRange().getDisplayValues();
        if (data.length > 1) {
          for (var i = 0; i < data.length; i++) {
            if (data[i][1] == uid_val) {
              if (data[i][3] !== "") {
                if (data[i][4] == "") {
                  Date_val = data[i][2];
                  TI_val = data[i][3];
                  enter_data = "time_out";
                  num_row = i + 1;
                  break;
                }
              }
            }
          }
        }

        if (enter_data == "time_in") {
          sheet_attendence.insertRows(2);
          sheet_attendence.getRange("A2").setValue(user_name_by_UID);
          sheet_attendence.getRange("B2").setValue(uid_val);
          sheet_attendence.getRange("C2").setValue(Curr_Date);
          sheet_attendence.getRange("D2").setValue(Curr_Time);
          sheet_attendence.getRange("F2").setValue(hid_val);
          SpreadsheetApp.flush();
          result += ",start" + "," + user_name_by_UID + "," + Curr_Date + "," + Curr_Time;
          return ContentService.createTextOutput(result);
        }
        //..................

        //..................Conditions for filling in "Time Out" attendance.
        else if (enter_data == "time_out") {
          sheet_attendence.getRange("E" + num_row).setValue(Curr_Time);
          result += ",stop" + "," + user_name_by_UID + "," + Date_val + "," + TI_val + "," + Curr_Time;
          return ContentService.createTextOutput(result);
        }

        else {
          result += ",Something Wrong" + "," + user_name_by_UID + "," + Curr_Date + "," + Curr_Time;
          return ContentService.createTextOutput(result);
        }
      }
    }
  }
}

function stripQuotes(value) {
  return value.replace(/^["']|['"]$/g, "");
}

function findLastRow(id_sheet, name_sheet, name_column) {
  var spreadsheet = SpreadsheetApp.openById(id_sheet);
  var sheet = spreadsheet.getSheetByName(name_sheet);
  var lastRow = sheet.getLastRow();

  var range = sheet.getRange(name_column + lastRow);

  if (range.getValue() !== "") {
    return lastRow;
  } else {
    return range.getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  }
}

function findUID(id_sheet, name_sheet, column_index, searchString) {
  var open_sheet = SpreadsheetApp.openById(id_sheet);
  var sheet = open_sheet.getSheetByName(name_sheet);
  var columnValues = sheet.getRange(2, column_index, sheet.getLastRow()).getValues();  // 1st is header row.
  var searchResult = columnValues.findIndex(searchString);  // Row Index - 2.

  return searchResult;
}

function checkUID(id_sheet, name_sheet, column_index, searchString) {
  var open_sheet = SpreadsheetApp.openById(id_sheet);
  var sheet = open_sheet.getSheetByName(name_sheet);
  var columnValues = sheet.getRange(2, column_index, sheet.getLastRow()).getValues();  // 1st is header row.
  var searchResult = columnValues.findIndex(searchString);  // Row Index - 2.

  if (searchResult != -1) {
    // searchResult + 2 is row index.
    sheet.setActiveRange(sheet.getRange(searchResult + 2, 3)).setValue("UID has been registered in this row.");
    return true;
  } else {
    return false;
  }
}

Array.prototype.findIndex = function (search) {
  if (search == "") return false;
  for (var i = 0; i < this.length; i++)
    if (this[i].toString().indexOf(search) > -1) return i;

  return -1;
}