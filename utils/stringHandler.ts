/**
 * Summary. Function that converts a string to UTF8 string.
 *
 * Description. The function converts a string to UTF8 string. However,
 * if it is null or undefined, the original value will be returned.
 *
 * @param {string | null | undefined}    originalString
 *
 * @return {<T>(originalString:T)=>T} The string converted to UTF8 or the original value if it is null or undefined.
 */
export const parseStringToUTF8 = <T extends string | null | undefined>(originalString: T): T => {
  if(typeof originalString === 'string') {
    return JSON.parse(JSON.stringify(originalString));
  }
  return originalString;
}

/**
 * Summary. Returns a string that complies with Excel Worksheet naming requirements.
 *
 * Description. The function check if the original string is longer than 31 characters
 *  and discards the remaining characters. Then, it remove characters that are not allowed
 *  according to Excel Worksheet naming requirements. Next, if the string is empty it sets
 *  a string number to the worksheet name. Finally, it will check if the name already exists
 *  in the workSheetNames Set, it will set a new string number and continue the process
 *  until it finds a string that does not exist in WorkSheetNames Set.
 *
 * @param {string}       playlistName     playlist name to be validated
 * @param {Set<String>}  worksheetNames   Set of previous worksheet Names      
 *
 * @return {string} A valid string that complies with Excel worksheet naming requirements.
 */
export const parseWorksheetName = (playlistName: string, worksheetNames: Set<string>) => {
  let validWorksheetName = playlistName;
  // Check 1 - String longer than 31 characters
  if(playlistName.length > 31) {
    validWorksheetName = validWorksheetName.substring(0, 31);
  }
  // Check 2 - Characters not allowed  : \ / ? * [ ] empty space tabs carriage return
  validWorksheetName = validWorksheetName.replace(/[\:\\\/\?\*\[\]\t\n\r]/g, '');
  // Check 3 - Validate if the name is empty
  let index = 0;
  if(validWorksheetName === '') {
    validWorksheetName = String(index);
  }
  index++;
  // Validate that the name does not already exist
  while(worksheetNames.has(validWorksheetName)) {
    validWorksheetName = String(index);
    index++;
  }
  return validWorksheetName;
}
