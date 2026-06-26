const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const targetsPath = path.join(__dirname, "temp-targets-out.json");
const enrichPath = path.join(__dirname, "temp-enrich.json");

if (!fs.existsSync(targetsPath)) {
  console.error("temp-targets-out.json not found! Please run get-enrichment-targets.js first.");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
const targets = fileData.targets;

console.log(`Processing enrichment for ${targets.length} targets...`);

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'japanese-spider-crab') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["xác động vật", "tảo biển", "nhuyễn thể", "cá nhỏ", "giáp xác nhỏ"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 50;
    newC.lifespan_max = 100;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Con cái mang trứng đã thụ tinh (lên tới 1.5 triệu quả) bám dưới các chi bụng. Ấu trùng zoea nở ra sẽ trôi nổi tự do trong nước biển nông trước khi biến thái qua giai đoạn megalopa và chìm xuống đáy sâu thành cua con.';
    newC.locomotion = 'crawl';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 3000.0;
    newC.size_max_mm = 3800.0;
    newC.weight_avg_g = 17000.0;

    newC.characteristics = (c.characteristics || "") + " Lớp vỏ kitin được phủ bởi các gai nhọn kitin hóa giúp tăng diện tích bám dính cho sinh vật ngụy trang và phân tán xung lực va đập.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng các gai nhỏ bám trên thân để kéo và đính các nhánh tảo biển đỏ có chứa các hợp chất kháng độc sinh học tự nhiên chống lại cá mập và bạch tuộc lớn.";
    newC.unique_traits = (c.unique_traits || "") + " Có cơ chế lột xác ngược độc đáo với nhịp sinh học được điều hòa bởi các thụ thể nhiệt độ nước lạnh sâu.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1093/jcbiol/ruac023",
        "label": "Journal of Crustacean Biology - Macrocheira kaempferi classification details"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mai của cua nhện Nhật Bản có hoa văn lồi lõm trông giống khuôn mặt người nên đôi khi được ngư dân Nhật liên hệ với truyền thuyết tâm linh."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khớp nối chi linh hoạt cho phép xoay vặn linh hoạt 360 độ quanh các kẽ đá để né tránh chấn động",
      "Cơ chế sinh học tự vệ chủ động cắt chi (autotomy) nhanh chóng tự cô lập vùng bị tổn thương và ngăn mất dịch cơ thể"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Không có cơ chế tự vệ chủ động bằng ngòi độc hay tuyến độc tố, hoàn toàn phụ thuộc vào ngụy trang vật lý"
    ];

  } else if (c.id === 'jewel-wasp') {
    newC.diet_type = 'parasitic';
    newC.diet_items = ["dịch hemolymph của gián Mỹ", "mật hoa", "nhựa cây"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'months';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Tò vò cái thụ tinh đẻ trứng trực tiếp lên chân con gián bị tê liệt. Ấu trùng nở ra sau vài ngày, khoan một lỗ nhỏ vào bụng gián, ăn dần các cơ quan không thiết yếu để giữ gián sống, sau đó hóa nhộng bên trong xác gián và chui ra khi trưởng thành.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 5.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 15.0;
    newC.size_max_mm = 22.0;
    newC.weight_avg_g = 0.05;

    newC.characteristics = (c.characteristics || "") + " Cánh của tò vò có cấu trúc màng siêu mỏng với các đường gân kitin gia cường giúp phân phối lực cản không khí tối ưu.";
    newC.survival_method = (c.survival_method || "") + " Bằng cách cắn đứt một nửa râu của con gián thây ma, nó giải phóng áp lực dịch tuần hoàn (hemolymph) để hút chất dinh dưỡng bổ sung năng lượng tức thời.";
    newC.unique_traits = (c.unique_traits || "") + " Ngòi châm có khả năng phát hiện nồng độ axit amin đặc trưng của mô thần kinh động vật để định vị hạch hầu.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1242/jeb.246102",
        "label": "Journal of Experimental Biology - Host brain surgery studies"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Tò vò ngọc lục bảo trưởng thành chỉ uống dịch mật hoa ngọt và nhựa cây để sống, hoàn toàn không ăn thịt gián, thịt gián chỉ dành cho ấu trùng."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng tiết ra chất nhờn chứa lipid đặc biệt trên vỏ kitin để giảm ma sát khi bò luồn lách qua các hốc hẹp tìm gián",
      "Khứu giác cực kỳ nhạy bén giúp nhận diện pheromone gián Mỹ từ khoảng cách xa"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Rất dễ mất nước trong điều kiện thời tiết khô hạn do diện tích bề mặt cơ thể côn trùng nhỏ"
    ];

  } else if (c.id === 'killer-whale') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["hải cẩu", "cá hồi", "cá trích", "cá voi tấm sừng non", "cá mập trắng lớn", "chim cánh cụt"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 50;
    newC.lifespan_max = 90;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh con (đẻ con) và nuôi con bằng sữa mẹ. Thời gian mang thai kéo dài từ 15 đến 18 tháng (một trong những chu kỳ dài nhất ở động vật có vú). Con non sinh ra được cả đàn bảo vệ và chăm sóc.';
    newC.locomotion = 'swim';
    newC.speed_max = 56.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 6000.0;
    newC.size_max_mm = 8000.0;
    newC.weight_avg_g = 4500000.0;

    newC.characteristics = (c.characteristics || "") + " Cơ thể thon gọn hình thoi kết hợp làn da nhẵn bóng giúp loại bỏ các dòng xoáy cản nước tại vận tốc cao.";
    newC.survival_method = (c.survival_method || "") + " Bày ra các đòn húc trực diện bằng đầu (ramming) với gia tốc lớn làm dập nát nội tạng cá mập hoặc cá heo nhỏ.";
    newC.unique_traits = (c.unique_traits || "") + " Thùy não sau phụ thuộc cảm giác thính giác phát triển phức tạp gấp nhiều lần so với con người, tạo ra bản đồ không gian 3D chi tiết bằng âm thanh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/mms.12880",
        "label": "Marine Mammal Science - Orca pod call dialects study details"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Cá voi sát thủ ngủ bằng cách nhắm một mắt và cho phép một nửa bán cầu não nghỉ ngơi, nửa còn lại duy trì nhận thức để thở và bơi."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng phối hợp đồng điệu tạo sóng thủy động lực học nhân tạo để đánh sập băng trôi có con mồi",
      "Khả năng kiểm soát nhịp tim (bradycardia) và lưu lượng máu tới não cực tốt khi lặn sâu đột ngột"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Nhạy cảm cao với ô nhiễm tiếng ồn đại dương (từ tàu bè, sonar quân sự) làm gián đoạn hệ thống định vị tiếng vang"
    ];

  } else if (c.id === 'king-cobra') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["rắn săn chuột", "rắn hổ mang khác", "cạp nia", "trăn nhỏ", "kỳ đà"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 15;
    newC.lifespan_max = 20;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Là loài rắn duy nhất tự xây tổ bằng cách thu gom lá cây. Con cái đẻ từ 20 đến 40 quả trứng vào tổ và nằm canh gác liên tục trong hơn 60 ngày cho đến khi trứng chuẩn bị nở thì mới rời đi tìm thức ăn.';
    newC.locomotion = 'crawl';
    newC.speed_max = 19.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 3000.0;
    newC.size_max_mm = 4500.0;
    newC.weight_avg_g = 8000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ cơ dọc sườn dài kéo dài suốt chiều dài cơ thể tạo lực đẩy sóng sin nhịp nhàng và mạnh mẽ trên mặt đất.";
    newC.survival_method = (c.survival_method || "") + " Tiên một lượng lớn nọc độc chứa cytotoxin hủy hoại tế bào và neurotoxin gây liệt cơ tim ngay khi cắn chặt đối thủ.";
    newC.unique_traits = (c.unique_traits || "") + " Tuyến độc tích hợp cơ co bóp chủ động giúp kiểm soát lượng độc tố phóng ra, cho phép cắn cảnh báo (cắn khô) hoặc cắn tiêu diệt.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1073/pnas.1314702110",
        "label": "PNAS - King Cobra genome and adaptation of snake venom system details"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù là loài rắn cực độc, rắn hổ mang chúa con khi vừa nở ra chỉ dài khoảng 50cm nhưng đã sở hữu nọc độc mạnh tương đương rắn trưởng thành."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ cổ phát triển cực kỳ mạnh mẽ để duy trì tư thế dựng đứng hàng giờ liền mà không mỏi",
      "Cấu trúc xương sọ linh hoạt kết hợp khớp động giữa giúp nuốt các loài rắn lớn dài hơn cơ thể mình"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Khi đang mang thai hoặc canh gác tổ, rắn cái nhịn ăn hoàn toàn dẫn đến thể lực suy kiệt nghiêm trọng"
    ];

  } else if (c.id === 'komodo-dragon') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["hưu", "lợn rừng", "trâu nước", "rồng Komodo nhỏ", "xác thối", "chim", "dê"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 25;
    newC.lifespan_max = 30;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Mùa sinh sản diễn ra vào khoảng tháng 7-8. Con cái đẻ khoảng 15-30 quả trứng vào tổ (thường chiếm dụng tổ của loài chim megapode) và ấp trứng trong khoảng 7-8 tháng. Trứng nở vào đầu mùa mưa khi nguồn thức ăn dồi dào.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 20.0;
    newC.conservation_status = 'EN';
    newC.size_min_mm = 2000.0;
    newC.size_max_mm = 3000.0;
    newC.weight_avg_g = 80000.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc da bao phủ bởi các gai cảm giác cơ học li ti giúp phát hiện các chuyển động rung động không khí và áp suất nhỏ nhất xung quanh.";
    newC.survival_method = (c.survival_method || "") + " Đớp cắn vào gân kheo của con mồi lớn như trâu nước rồi kiên nhẫn đi theo chờ đợi độc tố hủy hoại hệ tuần hoàn.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu lớp giáp xương osteoderm đan kết quanh sọ như một chiếc mũ bảo hiểm sinh học chống chấn thương nghiêm trọng.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1038/s41559-024-02477-7",
        "label": "Nature Ecology & Evolution - Iron-coated Komodo dragon teeth studies details"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù là kẻ săn mồi máu lạnh, rồng Komodo rất thích chơi đùa với các vật thể lạ như chai nước, giày dép khi được nuôi dưỡng trong môi trường bán hoang dã."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng bơi vượt biển xuất sắc để di chuyển qua lại giữa các hòn đảo lân cận nhằm mở rộng lãnh thổ săn mồi",
      "Hệ tiêu hóa sở hữu dịch vị có độ axit cực cao (pH ~ 1) phân hủy hoàn toàn xương, sừng và móng của con mồi"
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Nhịp tim giảm mạnh khi lặn dưới nước sâu hạn chế thời gian ở dưới nước lâu"
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
console.log("Successfully generated temp-enrich.json with enriched data!");

console.log("Calling update-enrichment.js script to persist the data...");
try {
  const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
  console.log(stdout);
} catch (err) {
  console.error("Error executing update-enrichment.js:", err.message);
  process.exit(1);
}
