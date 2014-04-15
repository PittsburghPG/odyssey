<?php
require_once ('constants_test.php'); 
$str = "";
				//dB connection to get all violations
				$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
				if (mysqli_connect_errno()) {
						printf("Connect failed: %s", mysqli_connect_error());
						exit;
				}
				$qNations = "SELECT b.Country, a.CountryCode, a.population, a.GDP, a.Income_level, b.Name, b.Age, b.Occupation, b.Origin, b.Neighborhood, b.FromHome, b.Video, b.PersonImage, b.CountryImage, b.WorldImage, b.Image2, b.Image3, b.Image4, b.Image5, b.Image6, b.Notes FROM countries a, people b where a.CountryID = b.CountryID order by a.Country";
				$result = $db->query($qNations);
				$numrecords = mysqli_num_rows ( $result );
				//$str = "var numrecords = " . $numrecords . ";var results = \"";
				$strResults = "";
				while($row = $result->fetch_array(MYSQLI_ASSOC)) {
						//$str .= "name.push(" .$row["Name"] . ");\n";
					if ($row["Name"] == "") {
							$strResults .= "personName.push(' ');\n";
							$strResults .= "unrepresented.push(\"" . $row["CountryCode"] . "\");\n";
						} else {
							$strResults .= "personName.push(\"" . htmlspecialchars($row["Name"]) . "\");\n";
						}
						if ($row["Country"] == "") {
							$strResults .= "countryName.push(' ');\n";
						} else {
							$strResults .= "countryName.push(\"" . $row["Country"] . "\");\n";
						}
						if ($row["CountryCode"] == "") {
							$strResults .= "countryAbbrev.push(' ');\n";
							
						} else {
							$strResults .= "countryAbbrev.push(\"" . $row["CountryCode"] . "\");\n";
						}
						$strResults .= "pop.push(\"" . $row["population"] . "\");\n";
						$strResults .= "gdp.push(\"" . $row["GDP"] . "\");\n";
						$strResults .= "income.push(\"" . $row["Income_level"] . "\");\n";
						$strResults .= "age.push(\"" . $row["Age"] . "\");\n";
						$strResults .= "occupation.push(\"" . $row["Occupation"] . "\");\n";
						$strResults .= "neighborhood.push(\"" . $row["Neighborhood"] . "\");\n";
						$strResults .= "origin.push(\"" . $row["Origin"] . "\");\n";
						$strResults .= "fromHome.push(\"" . $row["FromHome"] . "\");\n";
						$strResults .= "video.push(\"" . $row["Video"] . "\");\n";
						$strResults .= "personimage.push(\"" . $row["PersonImage"] . "\");\n";
						$strResults .= "countryimage.push(\"" . $row["CountryImage"] . "\");\n";
						$strResults .= "worldimage.push(\"" . $row["WorldImage"] . "\");\n";
						if ($row["Image2"] == "") {
							$strResults .= "image2.push(' ');\n";
						} else {
							$strResults .= "image2.push(\"" . $row["Image2"] . "\");\n";
						}
						if ($row["Image3"] == "") {
							$strResults .= "image3.push(' ');\n";
						} else {
							$strResults .= "image3.push(\"" . $row["Image3"] . "\");\n";
						}
						if ($row["Image4"] == "") {
							$strResults .= "image4.push(' ');\n";
						} else {
							$strResults .= "image4.push(\"" . $row["Image4"] . "\");\n";
						}
						if ($row["Image5"] == "") {
							$strResults .= "image5.push(' ');\n";
						} else {
							$strResults .= "image5.push(\"" . $row["Image5"] . "\");\n";
						}
						if ($row["Image6"] == "") {
							$strResults .= "image6.push(' ');\n";
						} else {
							$strResults .= "image6.push(\"" . $row["Image6"] . "\");\n";
						}
						$newNotes = preg_replace( "/\r|\n/", "", $row["Notes"]);
						$newNotes = addslashes($newNotes);
						$strResults .= "notes.push(\"" . $newNotes . "\");\n";
						
						
				} //end num_rows > 0
				
				$db->close();
//$str .= "\";"	;		
echo $strResults;
?>