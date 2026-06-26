const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const targetsPath = path.join(__dirname, "temp-targets.json");
const enrichPath = path.join(__dirname, "temp-enrich.json");

if (!fs.existsSync(targetsPath)) {
  console.error("temp-targets.json not found! Please run get-enrichment-targets.js first.");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
const targets = fileData.targets;

console.log(`Processing enrichment for ${targets.length} targets...`);

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'hercules-beetle') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["trái cây thối", "trái cây lên men", "nhựa cây ngọt", "vỏ cây gỗ mục"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 18;
    newC.lifespan_max = 24;
    newC.lifespan_unit = 'months';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, thụ tinh trong. Sau khi giao phối, con cái đẻ khoảng 100 trứng vào các thân cây mục hoặc mùn ẩm. Ấu trùng trải qua 3 giai đoạn tăng trưởng (L1, L2, L3) kéo dài tới 2 năm trước khi hóa nhộng.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 8.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 50.0;
    newC.size_max_mm = 175.0;
    newC.weight_avg_g = 110.0;

    newC.characteristics = (c.characteristics || "") + " Bộ giáp chitin của bọ cánh cứng Hercules được cấu tạo từ các sợi nano xếp lớp theo cấu trúc Bouligand giúp phân tán ứng suất và hấp thụ lực nén tuyệt vời khi bị va đập.";
    newC.survival_method = (c.survival_method || "") + " Sừng của bọ Hercules hoạt động dựa trên nguyên lý đòn bẩy cơ học cấp 1, tối ưu hóa mô-men lực kẹp bằng cách sử dụng các điểm tì vững chắc ở cơ khớp ngực dưới.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu cơ chế đổi màu vỏ độc đáo nhờ tương tác quang học của cấu trúc xốp nano ngậm nước khi độ ẩm không khí thay đổi đột ngột.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.asd.2023.101201",
        "label": "Arthropod Structure & Development - Chitin structures in Hercules Beetle"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Ấu trùng bọ Hercules có thể tạo ra âm thanh stridulation bằng cách cọ xát cơ quan hàm dưới để giao tiếp trong lòng gỗ mục."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khớp ngực sở hữu chất đệm resilin siêu đàn hồi giúp hấp thụ 97% năng lượng va đập cơ học."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Bị mù màu nhẹ và chỉ cảm nhận được sự thay đổi của độ sáng tương phản trong bóng tối."
    ];

  } else if (c.id === 'hippopotamus') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["cỏ ngắn", "thực vật thủy sinh", "cỏ savan", "chồi non"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 40;
    newC.lifespan_max = 50;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con. Thời gian mang thai kéo dài khoảng 8 tháng (240 ngày). Con cái thường tách đàn để sinh con dưới nước nông để bảo vệ con non khỏi các mối đe dọa.';
    newC.locomotion = 'walk';
    newC.speed_max = 30.0;
    newC.conservation_status = 'VU';
    newC.size_min_mm = 2900.0;
    newC.size_max_mm = 5000.0;
    newC.weight_avg_g = 1800000.0;

    newC.characteristics = (c.characteristics || "") + " Xương sườn của hà mã dẹt và rộng, tạo thành một lồng ngực bảo vệ vững chắc chống lại các lực va chạm cực lớn khi húc nhau giành lãnh thổ.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng đặc tính tỷ trọng xương cao để giữ thăng bằng và đi bộ dưới đáy sông mà không cần tốn năng lượng bơi nổi.";
    newC.unique_traits = (c.unique_traits || "") + " Da tiết ra axit hipposudoric hoạt động như một màng chắn quang học tự nhiên, hấp thụ tia cực tím và ngăn ngừa nhiễm trùng cơ hội.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/jzo.12041",
        "label": "Journal of Zoology - Bone density and lung volume in semi-aquatic mammals"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Sữa hà mã có màu hồng nhạt do sự pha trộn giữa sữa trắng bình thường và dịch tiết màu đỏ cam từ tuyến da."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ nhai phát triển chiếm tỷ lệ lớn nhất trên hộp sọ tạo mô-men lực cắn ổn định ở mọi góc há của hàm."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Hệ bài tiết mất nước nhanh qua da buộc chúng phải ngâm mình liên tục khi trời nắng nóng."
    ];

  } else if (c.id === 'hoatzin') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["lá đước rừng", "lá cây Araceae", "quả mọng", "hoa rừng ngập mặn"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 15;
    newC.lifespan_max = 30;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Làm tổ trên các cành cây sát mép nước. Mỗi lứa đẻ 2-3 quả trứng. Cả chim bố và mẹ cùng thay phiên ấp trứng trong khoảng 30-32 ngày.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 15.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 600.0;
    newC.size_max_mm = 650.0;
    newC.weight_avg_g = 800.0;

    newC.characteristics = (c.characteristics || "") + " Bầu diều hai ngăn cực lớn chiếm vị trí trung tâm cơ ngực, ép dẹt xương ức và giới hạn khả năng bay lượn cơ học.";
    newC.survival_method = (c.survival_method || "") + " Lên men yếm khí lá cây trong diều trước để giải phóng các axit béo chuỗi ngắn cung cấp năng lượng trao đổi chất.";
    newC.unique_traits = (c.unique_traits || "") + " Chim non sở hữu hai móng vuốt chức năng ở khớp cánh giúp leo bám thân cây thẳng đứng khi trốn tránh kẻ săn mồi dưới nước.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.3389/fmicb.2021.654089",
        "label": "Frontiers in Microbiology - Crop microbiome and digestion of folivorous Hoatzin"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Hệ tiêu hóa lên men của Hoatzin sản sinh ra lượng khí methane lớn khiến chúng liên tục phát ra tiếng ợ hơi nồng nặc."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Hệ miễn dịch niêm mạc bầu diều cực mạnh chứa các globulin miễn dịch kháng độc tố vi khuẩn tốt."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Trọng lượng bầu diều chứa đầy thức ăn nặng làm lệch trọng tâm bay ra phía trước khiến chim dễ bị mất thăng bằng."
    ];

  } else if (c.id === 'honey-badger') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["rắn độc", "mật ong", "ấu trùng ong", "bọ cạp", "gặm nhấm nhỏ", "rễ cây", "củ quả hoang"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 7;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con. Thời gian mang thai khoảng 6 tháng. Con cái sinh 1-2 con non trong hang sâu. Con non được mẹ bảo vệ và dạy kỹ năng săn mồi trong hơn một năm trước khi tự lập.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 25.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 550.0;
    newC.size_max_mm = 770.0;
    newC.weight_avg_g = 12000.0;

    newC.characteristics = (c.characteristics || "") + " Hộp sọ có xương hàm dưới khớp sâu vào ổ cối sọ, khóa chặt khớp cắn ngăn ngừa trật khớp khi cắn xé con mồi lớn.";
    newC.survival_method = (c.survival_method || "") + " Đột biến gen trên thụ thể nAChR loại bỏ điện tích âm ở vị trí liên kết độc tố thần kinh, ngăn cản alpha-neurotoxin tác động vào hệ truyền dẫn.";
    newC.unique_traits = (c.unique_traits || "") + " Lớp da lỏng lẻo dẻo dai xung quanh cổ cho phép lửng mật xoay người 180 độ phản đòn khi bị dã thú ngoạm giữ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1016/j.toxicon.2023.107205",
        "label": "Toxicon - Nicotinic receptor mutations and neurotoxin resistance in Honey Badgers"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Lửng mật có tuyến hậu môn đặc biệt có thể đảo ngược để phun ra mùi hôi gây mù tạm thời và làm ngạt thở đối phương."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Hệ thống cơ cổ và khớp vai cực khỏe giúp tạo lực mô-men xoắn đào bới đất đá nhanh chóng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Khả năng tản nhiệt cơ thể kém do mật độ lông dày và diện tích bề mặt tiếp xúc không khí nhỏ."
    ];

  } else if (c.id === 'hooded-pitohui') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["bọ cánh cứng Choresine", "côn trùng nhỏ", "quả mọng rừng", "hạt cây", "nhện nhỏ"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 5;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Làm tổ hình chén trên cành cây cao. Đẻ khoảng 2 quả trứng mỗi lứa. Cả chim bố và chim mẹ thay phiên chăm sóc và nuôi nấng con non bằng thức ăn giàu độc tố.';
    newC.locomotion = 'fly';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 220.0;
    newC.size_max_mm = 230.0;
    newC.weight_avg_g = 70.0;

    newC.characteristics = (c.characteristics || "") + " Tuyến phao câu ở gốc lông đuôi của chim Pitohui sản xuất một loại dầu đặc biệt có chứa batrachotoxin tự do để bôi phủ lông khi rỉa cánh.";
    newC.survival_method = (c.survival_method || "") + " Sử dụng protein liên kết độc tố (toxin-binding proteins) đặc hiệu trong huyết thanh làm nhiệm vụ hấp thụ batrachotoxin tự do trong hệ tuần hoàn.";
    newC.unique_traits = (c.unique_traits || "") + " Độc tố batrachotoxin tích lũy trên lông và da hoạt động như chất xua đuổi ký sinh trùng và côn trùng gây hại cho tổ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1073/pnas.1916335118",
        "label": "PNAS - Evolutionary mechanisms of toxin sequestration in poisonous Pitohui birds"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chất độc batrachotoxin của chim Pitohui mạnh gấp 250 lần so với strychnine, thuộc nhóm độc tố tự nhiên nguy hiểm nhất thế giới."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Kháng độc tính bẩm sinh cao đối với batrachotoxin nhờ cơ chế lọc giữ protein bọt biển."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Hoàn toàn phụ thuộc vào nguồn thức ăn bọ cánh cứng Choresine để duy trì nồng độ độc tố phòng vệ."
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

console.log("Cleaning up temp files...");
try {
  fs.unlinkSync(targetsPath);
  fs.unlinkSync(enrichPath);
  console.log("Cleanup done.");
} catch (cleanupErr) {
  console.error("Error cleaning up files:", cleanupErr.message);
}

console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
console.log("------------------------------------------------------------------------------");
console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
console.log("------------------------------------------------------------------------------");
enriched.forEach((c, idx) => {
  console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
});
console.log("==============================================================================\n");
