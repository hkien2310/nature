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
  console.log(`Selected targets for Round 31: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    if (c.id === 'dung-beetle') {
      const charAdd = "Ăn mòn cơ học được giảm thiểu nhờ cấu trúc khớp trượt nhẵn mịn và chất bôi trơn dạng lipid tự nhiên do các tuyến ngoại tiết ở chân tiết ra.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi gặp địa hình dốc hoặc chướng ngại vật phức tạp, chúng sử dụng chân giữa làm điểm tựa chịu lực chính để xoay hướng viên phân một cách điêu luyện mà không làm mất thăng bằng cơ thể.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Sở hữu gen thụ thể hóa học olfactory receptors (ORs) đa dạng vượt trội để giải mã chính xác các hợp chất hữu cơ dễ bay hơi phát ra từ phân động vật ở khoảng cách lớn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Khớp trượt cơ học chân trước trang bị lớp phủ lipid tự nhiên giảm thiểu ma sát khi đào bới liên tục.");
      addUniqueItem(newC.strengths, "Gen thụ thể khứu giác ORs đa dạng bậc nhất giúp phát hiện các dải hóa học của phân tươi trong không khí.");
      addUniqueItem(newC.weaknesses, "Cơ chế bay tiêu hao năng lượng cực lớn do tần số đập cánh cao, dễ bị kiệt sức nếu phải di chuyển liên tục trên 200 mét trong không khí.");
      addUniqueItem(newC.fun_facts, "Sừng của con đực không chỉ là vũ khí mà còn là cấu trúc chỉ thị chất lượng gene; con cái ưu tiên giao phối với con đực có sừng cân đối nhất.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1420-9101.2008.01637.x",
        label: "Journal of Evolutionary Biology - Horn development and plastic expression in Onthophagus taurus"
      });
    }

    else if (c.id === 'electric-eel') {
      const charAdd = "Mật độ bó sợi thần kinh vận động myelin hóa dày đặc bao quanh các cơ quan phát điện, đảm bảo tất cả các electrocyte được kích hoạt đồng bộ hóa tuyệt đối trong vòng 1-2 mili giây.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đối mặt với kẻ thù lớn ở vùng nước nông, chúng có khả năng phóng điện nhảy vọt terrestrial leaping strike để tối đa hóa điện thế truyền qua không khí vào cơ thể kẻ thù.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Đột biến tiến hóa của gen Scn4a mã hóa kênh natri phụ thuộc điện thế, chuyển đổi chức năng từ co cơ sang tích lũy và phóng điện năng cực đại.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cơ chế đồng bộ hóa sợi thần kinh myelin hóa kích hoạt 6.000 electrocytes trong vòng 1-2 mili giây.");
      addUniqueItem(newC.strengths, "Sự thích nghi tiến hóa của gen Scn4a chuyển hóa tế bào cơ thành tụ điện sinh học hiệu năng cao.");
      addUniqueItem(newC.weaknesses, "Điện trở của môi trường nước ngọt tinh khiết hoặc nước quá đục do bùn sét có thể làm suy giảm phạm vi hiệu dụng của điện trường phát ra.");
      addUniqueItem(newC.fun_facts, "Năng lượng điện từ một cú phóng điện cực đại có thể gây liệt cơ tim động vật có vú lớn ngay cả khi chúng chỉ đứng ở rìa mép nước.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.1258658",
        label: "Science - Catania's Electric Eel High-Voltage Attack Mechanisms"
      });
    }

    else if (c.id === 'emerald-elysia') {
      const charAdd = "Các tế bào biểu mô ruột có các vi nhung mao chuyên biệt để neo giữ lục lạp bọc màng kép, duy trì chuỗi truyền điện tử quang hợp ổn định.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để ứng phó với chu kỳ triều kiệt kéo dài, chúng gập sát hai thùy parapodia để giảm thiểu sự thoát nước và bảo vệ các lục lạp khỏi bị tổn thương do bức xạ UV cường độ cao.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Bộ gen chứa các chuỗi DNA ngoại lai mã hóa protein FtsH giúp sửa chữa liên tục trung tâm phản ứng quang hệ II (Photosystem II) của lục lạp bị lão hóa.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Khả năng biểu hiện gene mã hóa protein FtsH để bảo trì và sửa chữa lục lạp bị tổn hại do ánh sáng.");
      addUniqueItem(newC.strengths, "Cơ chế đóng gập parapodia chủ động để bảo vệ lục lạp khỏi sốc nhiệt và tia cực tím cực hạn.");
      addUniqueItem(newC.weaknesses, "Quá trình quang hợp tạo ra các gốc oxy hóa tự do (ROS) tích tụ trong mô tế bào ruột nếu không có đủ enzyme chống oxy hóa để trung hòa.");
      addUniqueItem(newC.fun_facts, "Dù mang lục lạp thực vật, ốc sên vẫn giữ nguyên các hành vi định hướng động vật như bò hướng sáng tích cực (phototaxis) để tìm vị trí phơi mình tốt nhất.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1104/pp.110.155705",
        label: "Plant Physiology - Photoprotection and maintenance of chloroplasts in Elysia chlorotica"
      });
    }

    else if (c.id === 'emperor-scorpion') {
      const charAdd = "Vỏ giáp chitin chứa các hợp chất huỳnh quang beta-carbolines hoạt động như tấm chắn bảo vệ mắt và các thụ cảm quang sinh học phân bố rải rác dưới da.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng sử dụng cặp càng to khỏe để đào các hang sâu hình chữ Y sâu tới 30cm dưới thảm rừng nhiệt đới, tạo ra vùng vi khí hậu có độ ẩm ổn định trên 80%.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Hệ thống cơ quan lược (pectines) ở mặt bụng chứa hàng ngàn thụ thể hóa học xúc giác peg sensilla giúp bản đồ hóa kết cấu và độ ẩm của mặt đất.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Hệ thống peg sensilla trên pectines đo đạc chính xác độ ẩm đất và pheromone của bạn tình.");
      addUniqueItem(newC.strengths, "Vỏ giáp chứa các hợp chất huỳnh quang beta-carbolines hoạt động như một bộ lọc tia UV tự nhiên.");
      addUniqueItem(newC.weaknesses, "Lớp màng khớp nối mỏng giữa các đốt giáp chân bò là điểm yếu dễ bị các loài kiến lửa hoặc ký sinh trùng xâm nhập tấn công.");
      addUniqueItem(newC.fun_facts, "Chúng có thể sống sót sau khi bị đóng băng hoàn toàn trong mùa đông bất thường nhờ các protein kháng đông tự nhiên trong dịch cơ thể.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cbpa.2008.01.037",
        label: "Comparative Biochemistry and Physiology - cuticular fluorescing compounds in scorpions"
      });
    }

    else if (c.id === 'ermine') {
      const charAdd = "Hộp sọ dẹt dài thuôn gọn cùng các xương sườn có khớp nối linh hoạt cao độ cho phép chúng uốn cong cơ thể gần như 180 độ trong các đường hầm chật hẹp.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong mùa đông khắc nghiệt, chúng săn lùng các loài gặm nhấm ngay dưới thảm tuyết dày (vùng subnivean) nhờ thính giác tần số cao cực nhạy.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Nhịp tim nghỉ ngơi đạt trên 300 nhịp/phút và có thể tăng vọt lên 600 nhịp/phút khi đi săn để cung cấp lượng oxy cực lớn cho các bó cơ sợi nhanh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cơ khớp xương sườn đàn hồi cao cho phép uốn gập cơ thể 180 độ trong hang hẹp.");
      addUniqueItem(newC.strengths, "Thính giác tần số cao nhạy bén định vị chính xác tiếng nhai của chuột dưới lớp tuyết dày.");
      addUniqueItem(newC.weaknesses, "Trữ lượng glycogen dự trữ trong cơ rất hạn chế do kích thước cơ thể nhỏ, dễ rơi vào trạng thái suy kiệt glucose nếu vận động cường độ cao liên tục.");
      addUniqueItem(newC.fun_facts, "Chồn Ecmin có thể chất động lực học phi thường, thực hiện các cú nhảy bật liên tục xa tới gấp 4-5 lần chiều dài cơ thể để đuổi bắt thỏ rừng.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1093/jmammal/gyy113",
        label: "Journal of Mammalogy - Winter subnivean hunting and caching behavior in Mustela erminea"
      });
    }

    return newC;
  });

  // Write file
  const tempFilePath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(tempFilePath, JSON.stringify(enriched, null, 2));
  console.log(`Successfully generated temp-enrich.json at ${tempFilePath}`);

  console.log("Calling update-enrichment.js script to persist the data... ");
  try {
    const updateScriptPath = path.join(__dirname, "update-enrichment.js");
    const output = execSync(`node ${updateScriptPath} ${tempFilePath}`, { encoding: "utf-8" });
    console.log(output);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout);
    if (err.stderr) console.error("Stderr:", err.stderr);
    process.exit(1);
  }

  // Clean up
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  targets.forEach((t, i) => {
    console.log(`${i + 1} | ${t.name} | ${t.id} | ${t.class} | ${t.enrichment_count + 1}`);
  });
  console.log("==============================================================================");
}

run();
