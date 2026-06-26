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

  if (c.id === 'largetooth-sawfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "cua", "tôm", "động vật thân mềm đáy cát", "mực"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 30;
    newC.lifespan_max = 35;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Đẻ con (aplacental viviparity). Thời gian mang thai khoảng 5 tháng. Mỗi lứa đẻ từ 1 đến 12 con non. Đao của con non khi sinh ra được bọc trong một màng gelatin dày để bảo vệ mẹ khỏi bị thương, màng này sẽ tự tan biến sau vài ngày.';
    newC.locomotion = 'swim';
    newC.speed_max = 18.0;
    newC.conservation_status = 'CR';
    newC.size_min_mm = 3000.0;
    newC.size_max_mm = 7000.0;
    newC.weight_avg_g = 350000.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc cơ hàm của chúng đã tiến hóa để tối ưu hóa lực bóp phẳng nghiền nát lớp vỏ kitin siêu cứng của con mồi đáy biển, với mô liên kết cơ hàm khỏe hoạt động độc lập với đao.";
    newC.survival_method = (c.survival_method || "") + " Khả năng ngủ bán cầu não độc đáo giúp chúng vừa nghỉ ngơi vừa duy trì cảnh giác trước kẻ thù lớn như cá mập bò trong môi trường nước đục của cửa sông.";
    newC.unique_traits = (c.unique_traits || "") + " Da của cá đao có cấu trúc phủ các vảy hình răng cưa phân bố dày đặc giúp giảm lực cản nước khi tăng tốc vung đao bất ngờ, đồng thời làm giảm tiếng động cơ học khi tiếp cận con mồi.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/jfb.15234",
        "label": "Journal of Fish Biology - Largetooth sawfish conservation status and habitat use study"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Đao của cá đao có thể chiếm tới 1/3 tổng chiều dài cơ thể của chúng khi ở giai đoạn con non.",
      "Mặc dù là cá sụn khổng lồ, chúng hiếm khi tấn công con người trừ khi bị kích động hoặc vướng vào lưới kéo đáy."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng phát hiện điện trường cực nhỏ từ tim con mồi ở khoảng cách 1 mét nhờ đao rostrum bọc hàng ngàn ampullae of Lorenzini.",
      "Cú quất đao ly tâm có lực chém đứt gốc và khả năng gây choáng tức thì cho đàn cá bơi nhanh."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Độ nhạy cảm cực cao với ô nhiễm kim loại nặng tích tụ trong trầm tích bùn đáy rạn cửa sông."
    ];

  } else if (c.id === 'leafcutter-ant') {
    newC.diet_type = 'herbivore';
    newC.diet_items = ["nấm cộng sinh Leucoagaricus gongylophorus", "dịch lá cây tươi", "mật hoa", "gongylidia"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Kiến chúa thực hiện chuyến bay giao phối (nuptial flight) duy nhất trong đời để nhận và tích trữ hàng triệu tinh trùng từ nhiều kiến đực, đủ dùng để đẻ trứng thụ tinh suốt đời. Trứng không thụ tinh sẽ nở thành kiến đực.';
    newC.locomotion = 'walk';
    newC.speed_max = 0.08;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 2.0;
    newC.size_max_mm = 22.0;
    newC.weight_avg_g = 0.03;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ hàm hàm trên (mandibles) sở hữu tế bào liên kết kẽm sinh học sắp xếp theo cấu trúc mạng tinh thể nano giúp phân tán lực đều, ngăn chặn sứt mẻ khi va chạm vật cứng.";
    newC.survival_method = (c.survival_method || "") + " Sử dụng các chú kiến lính làm lá chắn sống, xếp chồng cơ thể bảo vệ tổ trước sự xâm lăng của kiến quân đội hoặc động vật ăn côn trùng lớn.";
    newC.unique_traits = (c.unique_traits || "") + " Cơ chế tự làm sạch bằng cách cọ xát cơ thể tiết ra lớp sáp kháng nấm sinh học bảo vệ vườn nấm khỏi các bào tử nấm độc dại ký sinh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1038/s41467-020-19565-4",
        "label": "Nature Communications - Biomineral armor in leaf-cutter ants studies"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Kiến cắt lá có thể mang những chiếc lá nặng gấp 50 lần cơ thể chúng di chuyển quãng đường dài tương đương một con người chạy marathon vác trên vai một chiếc ô tô.",
      "Mỗi siêu thuộc địa kiến cắt lá có thể dọn sạch 15-20% diện tích thảm lá rừng mưa xung quanh tổ của chúng mỗi năm."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng tạo lực cắt xoay tương tự cưa máy nhờ tần số rung hàm đạt mức 1000 Hz.",
      "Lớp khoáng calcite-magiê cứng bao bọc toàn bộ cơ thể tăng gấp đôi độ bền cơ học trước các đòn cắn đè ép."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Sự phụ thuộc tuyệt đối vào nhiệt độ tổ duy trì ở mức 25-28 độ C để vườn nấm Leucoagaricus không bị thối rữa."
    ];

  } else if (c.id === 'leafy-seadragon') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["tôm nhỏ Mysis", "giáp xác nhỏ", "sinh vật phù du", "ấu trùng cá"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 7;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Trực tiếp chuyển trứng từ con cái sang nếp gấp da chứa nhiều mao mạch ở phần đuôi của con đực. Con đực mang thai nuôi dưỡng trứng khoảng 4 đến 9 tuần trước khi trứng nở ra hải long con tự lập hoàn toàn.';
    newC.locomotion = 'swim';
    newC.speed_max = 0.15;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 350.0;
    newC.weight_avg_g = 100.0;

    newC.characteristics = (c.characteristics || "") + " Hệ da dạng lá chứa tế bào sắc tố chromatophore mật độ cao có khả năng tự động phản xạ và điều chỉnh sắc độ theo cường độ ánh sáng mặt trời chiếu xuyên qua tầng tảo bẹ.";
    newC.survival_method = (c.survival_method || "") + " Khả năng tự phồng da cổ để tạo hiệu ứng khúc xạ quang học ảo dưới nước làm kẻ thù khó ước lượng chính xác kích thước thật.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tự tái sinh các phiến da hình lá khi bị động vật khác rỉa cắn mà không gây ảnh hưởng đến hệ thần kinh hay cấu trúc mạch máu chính.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1073/pnas.2121465119",
        "label": "PNAS - Genomes of Leafy and Weedy Seadragons Studies"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Hải long lá đực mang thai thực chất có liên kết trao đổi chất với trứng thông qua mạng lưới mao mạch dày đặc cung cấp oxy trực tiếp cho phôi.",
      "Mặc dù là biểu tượng của Nam Úc, chúng cực kỳ khó nuôi dưỡng trong các bể cá nhân tạo thông thường do yêu cầu khắt khe về chuyển động nước."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế mõm dài dạng ống hút chân không siêu tốc tạo áp suất âm cực lớn nuốt mồi trong vòng 6 miligiây.",
      "Mắt hoạt động hoàn toàn độc lập 360 độ giúp theo dõi đồng thời hai mục tiêu khác nhau ở hai hướng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tuyệt đối không có khả năng chống chọi trước các đợt thủy triều đỏ gây ô nhiễm tảo ngạt thở."
    ];

  } else if (c.id === 'leopard-seal') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["chim cánh cụt", "hải cẩu nhỏ", "nhuyễn thể Krill", "cá", "mực"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 12;
    newC.lifespan_max = 26;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Giao phối dưới nước. Mang thai khoảng 9 tháng. Con cái có hiện tượng cấy phôi muộn (delayed implantation) trong 2-3 tháng để con non sinh ra trên lớp băng trôi vào mùa hè Nam Cực. Mỗi lứa đẻ 1 con.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 2400.0;
    newC.size_max_mm = 3500.0;
    newC.weight_avg_g = 450000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ hô hấp thích nghi áp suất cao với dung tích phổi co giãn linh hoạt giúp tránh tràn dịch màng phổi khi lặn sâu đột ngột.";
    newC.survival_method = (c.survival_method || "") + " Kỹ thuật săn mồi phối hợp cơ hội dựa vào bóng của các tảng băng để che mắt chim cánh cụt từ phía dưới trước khi phóng lên vồ mồi.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng tự kích hoạt cơ chế chống đông máu trong thời gian lặn sâu kéo dài ngăn nghẽn mạch máu ngoại vi do nhiệt độ cực lạnh.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.3354/meps094247",
        "label": "MEPS - Leopard seal sexual size dimorphism and foraging ecology studies"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Hải cẩu báo là loài hải cẩu duy nhất sở hữu bài hát giao phối có ngữ pháp âm thanh thay đổi tùy theo vị trí địa lý của các quần thể.",
      "Chúng có thói quen tò mò chơi đùa với xuồng cao tốc của các nhà nghiên cứu Nam Cực trước khi bỏ đi."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Hàm răng kép đa năng vừa có răng nanh cắn xé mồi lớn vừa có răng hàm lọc nhuyễn thể giống cá voi.",
      "Cơ hàm khỏe tạo lực cắn lên tới hàng ngàn Newton kết hợp răng nanh sắc bén kết liễu mồi nhanh gọn."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Tốc độ di chuyển trên cạn cực kỳ chậm chạp và vụng về do cơ thể nặng nề và chi sau biến đổi hoàn toàn thành vây bơi."
    ];

  } else if (c.id === 'lionfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá con", "tôm", "cua", "động vật giáp xác nhỏ", "mực ống nhỏ"];
    newC.activity_pattern = 'crepuscular';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Một cặp cá đực và cá cái thực hiện vũ điệu giao phối phức tạp gần mặt nước. Con cái phóng ra hai bọc trứng chứa khoảng 10.000 - 30.000 trứng nổi bám vào chất nhầy kháng khuẩn, trứng thụ tinh ngoài bởi con đực.';
    newC.locomotion = 'swim';
    newC.speed_max = 2.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 300.0;
    newC.size_max_mm = 380.0;
    newC.weight_avg_g = 1250.0;

    newC.characteristics = (c.characteristics || "") + " Cấu trúc xương của các gai độc lưng là sụn calci hóa rỗng ruột kết hợp cơ thắt vây lưng ép nọc độc từ gốc gai phun thẳng vào vết thương.";
    newC.survival_method = (c.survival_method || "") + " Phun các tia nước nhỏ (water jets) định hướng nhằm làm nhiễu cơ quan đường bên và đánh lừa hệ thống định vị của con mồi.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng bất hoạt độc tố protein bằng phản ứng nhiệt hóa ở nhiệt độ trên 45 độ C giúp chúng tự đào thải nọc thừa tránh nhiễm độc chính mình.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.3389/fmars.2020.573123",
        "label": "Frontiers in Marine Science - Lionfish Invasion and Ecological Impacts study"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Mặc dù nọc độc cá sư tử gây đau đớn khủng khiếp cho con người, thịt của chúng lại cực kỳ thơm ngon và đang được khuyến khích đánh bắt làm thực phẩm tại vùng vịnh Mexico.",
      "Cá sư tử có thể làm giảm tới 79% quần thể cá con bản địa trong rạn san hô chỉ sau 5 tuần xuất hiện."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Dạ dày siêu co giãn gấp 30 lần thể tích ban đầu kết hợp nồng độ axit dạ dày cực cao giúp phân rã vảy và xương mồi nhanh chóng.",
      "Hệ bài tiết chất nhầy chứa peptide kháng sinh giúp ngăn chặn ký sinh trùng và nấm bám vào lớp biểu bì da."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Màu sắc quá rực rỡ khiến chúng hoàn toàn không thể phục kích trên nền cát trắng trống trải."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
console.log("Successfully generated temp-enrich.json with enriched data!");

// Call update-enrichment.js
console.log("Calling update-enrichment.js script to persist the data...");
try {
  const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
  console.log(stdout);
} catch (err) {
  console.error("Error executing update-enrichment.js:", err.message);
  process.exit(1);
}

// Cleanup
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
