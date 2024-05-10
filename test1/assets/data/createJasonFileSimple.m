clc
clear all
close all

pkg load io
inputFilename="RayamajhiFamilyDatabase.xlsx";
outputFilename = "data_SampleSimple.js";


districtName={'Palpa', 'Kabhareplanchowk'};

%===========Generate Jason File================
fid = fopen (outputFilename, "w");
fprintf(fid,'%s\n', 'data = [');


for k=1:length(districtName)
    [~, ~, rawarr, ~]=xlsread(inputFilename,districtName{k});

    if k==1
      startNum=2;
      else
       startNum=3;
    end

    lastTag=",";
    for i=startNum:size(rawarr,1)
      person.name=rawarr{i,2};
      person.father=rawarr{i,3};
      person.mother=rawarr{i,4};
      person.spouse=rawarr{i,5};
      person.gender=rawarr{i,6};
      person.ID=rawarr{i,7};
      person.spouseID=rawarr{i,8};
      person.unionID=rawarr{i,9};
      person.gen=rawarr{i,10};

    %% Detect Parent ID

    parentID=fnc_getParentID(rawarr,person);

    if isempty(parentID)
      parentID="null";
    end

    if (i==size(rawarr,1) && k==length(districtName))
      lastTag="";
    end

      entry=[ '{ "id" : "' person.ID  '", "name" : "' person.name '", "gender" : "' person.gender  '", "parent" : "' parentID ...
            '", "spouse" : "' person.spouse '", "gen" : "' num2str(person.gen) '"}' lastTag];

      fprintf(fid,'  %s\n',entry);


    end
end

fprintf (fid, "];");
fclose (fid);

comment='done'

