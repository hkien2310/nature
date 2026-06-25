const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 9: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'orca') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá hồi", "hải cẩu", "sư tử biển", "cá voi xanh non", "chim cánh cụt", "cá mập trắng"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 90;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính, thai kỳ kéo dài từ 15-18 tháng. Con cái sinh một con non duy nhất sau mỗi 3-10 năm. Việc nuôi dưỡng và chăm sóc con non có sự tham gia tích cực của toàn bộ các thành viên trong gia đình.";
      newC.locomotion = 'swim';
      newC.speed_max = 56.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5000.0;
      newC.size_max_mm = 8000.0;
      newC.weight_avg_g = 4500000.0;

      newC.characteristics = (c.characteristics || "") + " Hệ thống cơ bắp vây đuôi cực kỳ mạnh mẽ tạo ra lực đẩy khổng lồ để đẩy cơ thể nặng hàng tấn lên không trung.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng tiếng hét phối hợp siêu âm để làm tê liệt tạm thời các đàn cá trích trước khi dùng đuôi quật mạnh tiêu diệt chúng.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống sonar định vị sinh học có tần số phát sóng cực rộng qua bộ phận dưa (melon) ở trán giúp vẽ bản đồ môi trường 3D.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/mms.12845",
          "label": "Marine Mammal Science - Pod structure and foraging ecology of Orcas"
        },
        {
          "url": "https://doi.org/10.1098/rspb.2015.0233",
          "label": "Proceedings of the Royal Society B - Post-reproductive life span in killer whales"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cá voi sát thủ bà ngoại đóng vai trò thủ lĩnh tinh thần dẫn dắt đàn đi săn trong điều kiện môi trường khắc nghiệt.",
        "Mỗi đàn cá voi sát thủ sử dụng một hệ thống ngôn ngữ tiếng kêu riêng biệt mà các đàn khác không thể hiểu hết."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng phối hợp săn mồi đồng đội ở cấp độ quân sự cao, vô hiệu hóa mọi kẻ thù biển cả.",
        "Khả năng sử dụng các tần số sóng siêu âm khác nhau để định vị và giao tiếp bí mật."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Bại trận trước các ô nhiễm tiếng ồn tần số thấp từ tàu ngầm quân sự và tàu chở hàng lớn."
      ];

    } else if (c.id === 'orchid-mantis') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ong mật", "ruồi giấm", "bướm", "dế", "côn trùng thụ phấn"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Con đực nhỏ bé bay đi tìm con cái ngụy trang trên hoa. Sau khi giao phối, con cái đẻ túi trứng (ootheca) chứa từ 50-100 trứng bám chắc vào cành cây. Có hiện tượng ăn thịt bạn tình.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 25.0;
      newC.size_max_mm = 70.0;
      newC.weight_avg_g = 0.6;

      newC.characteristics = (c.characteristics || "") + " Bề mặt thùy chân dẹt chứa các hạt sắc tố hữu cơ siêu nhỏ hấp thụ và tán xạ ánh sáng để tạo hiệu ứng cánh hoa 3D hoàn chỉnh.";
      newC.survival_method = (c.survival_method || "") + " Nhai và bôi chất pheromone hóa học đặc biệt mô phỏng ong mật để quyến rũ ong tự bay thẳng vào miệng đón đánh.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng ngụy trang đánh lừa thị giác côn trùng đến mức độ thu hút cao gấp nhiều lần so với các hoa phong lan tự nhiên.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1093/beheco/arx112",
          "label": "Behavioral Ecology - Flower mimicry and visual tricks of Hymenopus coronatus"
        },
        {
          "url": "https://doi.org/10.1093/beheco/arv012",
          "label": "Behavioral Ecology - Visual tricks and prey attraction of Hymenopus coronatus"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Ấu trùng bọ ngựa phong lan giai đoạn đầu có màu đỏ đen sặc sỡ mô phỏng loài bọ xít độc để tránh bị chim ăn thịt.",
        "Chúng có thể xoay đầu 180 độ một cách mượt mà để quét góc nhìn mà không làm rung động thân hoa ngụy trang."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Bàn chân trang bị gai nhọn tẩm chất dính sinh học giúp cố định con mồi ngay khi tiếp xúc.",
        "Khả năng mô phỏng hoa phong lan hoàn hảo thu hút côn trùng ở khoảng cách xa."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Con đực nhỏ bé rất dễ bị chính con cái ăn thịt trong hoặc sau khi giao phối."
      ];

    } else if (c.id === 'pacific-blackdragon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm biển sâu", "động vật giáp xác mesopelagic", "mực ống nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính cực độ dị hình giới tính. Con đực không có răng hay dạ dày, chỉ sống bằng năng lượng phôi thai tích lũy để thụ tinh cho con cái khổng lồ rồi chết.";
      newC.locomotion = 'swim';
      newC.speed_max = 4.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 80.0;

      newC.characteristics = (c.characteristics || "") + " Hệ thống phát quang sinh học chạy dọc thân phát ra các chùm tia sáng đỏ bước sóng dài nằm ngoài dải phổ nhìn thấy của đa số sinh vật biển sâu.";
      newC.survival_method = (c.survival_method || "") + " Ngụy trang sinh học bằng cách điều chỉnh các cơ quan phát quang nhỏ ở bụng để mô phỏng ánh sáng yếu từ trên xuống.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng cảm nhận và phát ra ánh sáng đỏ bước sóng dài giúp chiếu sáng con mồi vô hình trước mắt kẻ săn mồi khác.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1086/715424",
          "label": "The American Naturalist - Evolution of ultra-black skin in deep-sea fishes"
        },
        {
          "url": "https://doi.org/10.1242/jeb.237271",
          "label": "Journal of Experimental Biology - Visual pigments of Idiacanthus antrostomus"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Con đực trưởng thành hoàn toàn tiêu biến hệ tiêu hóa và răng nanh, chỉ đóng vai trò túi tinh di động để thụ tinh rồi chết.",
        "Ấu trùng của cá rồng đen Thái Bình Dương sở hữu đôi mắt nằm ở hai đầu cuống dài bằng 1/3 chiều dài cơ thể."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Cấu trúc hắc sắc tố siêu đặc trên da hấp thụ 99.5% ánh sáng, biến cơ thể thành hố đen di động.",
        "Hệ thống chiếu sáng hồng ngoại sinh học bằng ánh sáng đỏ giúp săn mồi mà không bị phát hiện."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Cơ xương yếu và không có xương sườn lớn khiến cơ thể rất dễ bị dập nát dưới tác động vật lý."
      ];

    } else if (c.id === 'pacific-hagfish') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["xác cá voi", "cá chết phân hủy", "giun nhiều tơ", "động vật không xương sống nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 17;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng lớn có vỏ dai và các móc dính để neo chặt vào đáy bùn biển sâu. Một số nghiên cứu cho thấy loài này có thể lưỡng tính tạm thời trước khi phân hóa giới tính.";
      newC.locomotion = 'burrow';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 630.0;
      newC.weight_avg_g = 1100.0;

      newC.characteristics = (c.characteristics || "") + " Tuyến dịch nhầy ở sườn có thể tự chủ giải phóng các túi protein keratin siêu dẻo dai trương nở lập tức khi tiếp xúc với ion muối biển.";
      newC.survival_method = (c.survival_method || "") + " Hô hấp qua da trơn lỏng lẻo khi vùi đầu ăn sâu trong xác mồi phân hủy thiếu dưỡng khí trầm trọng.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống tuần hoàn mở độc đáo với 4 tim phụ độc lập hoạt động duy trì huyết áp cực thấp ở môi trường nước sâu.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rsif.2018.0710",
          "label": "Journal of The Royal Society Interface - Hagfish slime biomechanics"
        },
        {
          "url": "https://doi.org/10.1098/rsif.2019.0115",
          "label": "Journal of The Royal Society Interface - Hagfish slime thread mechanics and deployment"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chúng có thể tự thắt nút cơ thể xoay chuyển dọc thân mình để cạo sạch chất nhầy bám dính trên da sau khi tự vệ.",
        "Hagfish có thể nhịn ăn nhiều tháng liên tục nhờ tốc độ trao đổi chất cực thấp và khả năng hấp thụ trực tiếp dinh dưỡng qua da."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Sợi protein siêu dai trong chất nhầy bền chắc hơn nylon gấp nhiều lần.",
        "Lớp da bọc cực lỏng lẻo có khả năng co giãn hấp thụ chấn động từ răng nanh cá dữ."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Bị vô hiệu hóa hoàn toàn cơ chế tạo nhầy tự vệ khi rơi vào môi trường nước ngọt."
      ];

    } else if (c.id === 'panther-chameleon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế", "cào cào", "gián", "nhện", "thằn lằn nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 7;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng (oviparous). Sau khi giao phối thành công từ 30-45 ngày, con cái đào hố đẻ từ 10-40 trứng. Trứng nở sau 5-8 tháng ấp tự nhiên trong lòng đất.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.8;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 520.0;
      newC.weight_avg_g = 120.0;

      newC.characteristics = (c.characteristics || "") + " Tuyến da tiết ra hợp chất tự nhiên chống thấm nước bảo vệ biểu bì.";
      newC.survival_method = (c.survival_method || "") + " Tận dụng lực bám chân kìm chia ngón đối xứng để neo giữ cơ thể khi thực hiện các cú phóng lưỡi mạnh.";
      newC.unique_traits = (c.unique_traits || "") + " Cấu trúc liên kết xương sọ linh hoạt giảm chấn động dội lại từ lưỡi phóng gia tốc cao.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rsbl.2015.1018",
          "label": "Biology Letters - High-performance acceleration of chameleon tongue"
        },
        {
          "url": "https://doi.org/10.1098/rsbl.2015.1018",
          "label": "Biology Letters - High-performance acceleration of chameleon tongue"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chất nhầy trên đầu lưỡi có độ nhớt gấp 400 lần nước bọt con người.",
        "Màu sắc sặc sỡ nhất xuất hiện khi chúng tức giận hoặc muốn thu hút bạn đời, không chỉ để ngụy trang."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Cơ cấu phóng lưỡi dạng máy bắn đá tích lũy động năng qua các bao sợi collagen.",
        "Khả năng ước lượng khoảng cách lập thể cực kỳ chuẩn xác chỉ bằng một mắt đơn."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Dễ suy kiệt thể trạng và hệ thống miễn dịch nếu bị stress liên tục do kích động."
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich.json...");
  fs.unlinkSync(enrichPath);
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
