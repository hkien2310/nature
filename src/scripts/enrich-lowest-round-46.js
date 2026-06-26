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
  console.log(`Selected targets for Round 46: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
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

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'pom-pom-crab') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["tảo", "mảnh vụn hữu cơ", "vi sinh vật", "giáp xác nhỏ", "giun nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thụ tinh trong. Con cái mang bọc trứng thụ tinh dưới bụng (pleopods) có màu cam rực rỡ cho đến khi trứng nở thành ấu trùng zoea bơi tự do trong dòng nước trước khi biến thái thành cua con.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 10.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 7.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu các chân bò phụ có vuốt bám mảnh để leo bám vách đá và giữ thăng bằng khi hai càng bận nâng găng tay hải quỳ.");
      newC.survival_method = appendText(c.survival_method, "Chủ động kiểm soát chế độ dinh dưỡng của vật cộng sinh bằng cách cướp thức ăn trực tiếp từ xúc tu hải quỳ để kìm hãm kích thước găng tay.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ cấu chân ngực thứ hai tiến hóa thon dài linh hoạt thay thế hoàn hảo chức năng đưa thức ăn vào miệng của đôi càng bị chiếm dụng.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nhân bản vô tính vật cộng sinh bằng cách chủ động xé đôi thân hải quỳ khi bị mất một chiếc.");
      addUniqueItem(newC.strengths, "Đôi càng nhỏ nhưng có cơ khớp khóa gai chuyên dụng kẹp chặt thân hải quỳ mà không gây chấn thương mô.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Lớp vỏ kitin rất mỏng và giòn, không đủ chống chịu các đòn cắn từ cá săn mồi cỡ vừa nếu bị tước vũ khí.");
      addUniqueItem(newC.weaknesses, "Đôi càng bị thu nhỏ tiến hóa thành các móc kẹp chỉ để giữ hải quỳ, làm mất đi khả năng kẹp xé vật lý thông thường.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khi cua đấm bốc lột xác, chúng đặt hai con hải quỳ xuống bên cạnh, lột lớp vỏ cũ ra rồi dùng lớp vỏ mới còn mềm mại để nhặt lại hải quỳ rất nhẹ nhàng.");
      addUniqueItem(newC.fun_facts, "Hải quỳ được cua đấm bốc 'chăm sóc' thường có tốc độ phân chia tế bào sinh sản vô tính nhanh hơn nhiều so với hải quỳ sống tự do ngoài tự nhiên.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.7717/peerj.2910",
        label: "PeerJ - Asexual reproduction of sea anemones induced by boxer crabs"
      });

    } else if (c.id === 'portuguese-man-o-war') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá con", "ấu trùng cá", "giáp xác nhỏ", "tôm nhỏ", "động vật thân mềm trôi nổi"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính thông qua các gonozooids chuyên biệt. Các cá thể giải phóng tinh trùng và trứng trực tiếp vào nước biển để thụ tinh ngoài, phát triển thành ấu trùng plankton rồi nảy chồi vô tính hình thành quần thể mới.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 90.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 450.0;

      newC.characteristics = appendText(c.characteristics, "Phao khí chứa hỗn hợp carbon monoxide, nitrogen và oxygen dưới áp suất cao giúp tạo sức căng tối ưu cho lớp màng ngoài chống lại tia cực tím.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng sừng vây cơ học trên phao nổi để tự động chuyển hướng trôi theo một góc nghiêng nhất định so với hướng gió chính nhằm tránh dạt vào bờ.");
      newC.unique_traits = appendText(c.unique_traits, "Zooids dactylozooid có cơ cấu tế bào cơ trơn chạy dọc cho phép co giãn xúc tu tới 30m với lực kéo bền bỉ đáng kinh ngạc.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Nọc độc peptide thần kinh cực độc phá hủy hệ hô hấp và tim mạch của con mồi trong vài giây.");
      addUniqueItem(newC.strengths, "Xúc tu săn mồi giăng lưới cực rộng dài tới 30m giúp tối đa hóa khả năng bắt mồi mà không cần bơi.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hoàn toàn phụ thuộc vào gió và dòng biển để di chuyển, dễ bị bão lớn thổi dạt vào bờ cát gây tử vong hàng loạt.");
      addUniqueItem(newC.weaknesses, "Hệ thống phao nổi khí mỏng dễ bị đâm thủng hoặc phá hủy cơ học bởi rác thải nhựa đại dương.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Từng xúc tu bị đứt lìa vẫn có thể co rút cơ học độc lập và châm độc trong vòng nhiều ngày nếu được giữ ẩm trong nước biển.");
      addUniqueItem(newC.fun_facts, "Chất độc của chúng vẫn giữ nguyên độc lực mạnh và khả năng kích hoạt phản xạ châm gai ngay cả khi xúc tu đã bị đứt lìa trôi dạt trên biển.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rspb.2021.0543",
        label: "Proceedings of the Royal Society B - Colonial organization of Physalia physalis"
      });

    } else if (c.id === 'portuguese-man-of-war') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá con", "ấu trùng cá", "tôm nhỏ", "giáp xác nhỏ", "sinh vật phù du"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính bằng cách giải phóng giao tử từ gonozooid vào cột nước để thụ tinh ngoài. Trứng thụ tinh phát triển thành phôi bơi tự do, sau đó nảy chồi vô tính phân hóa thành các zooids chuyên biệt.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.8;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 90.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 400.0;

      newC.characteristics = appendText(c.characteristics, "Lớp vỏ màng phao khí có sắc tố carotenoid và biliprotein màu xanh phản chiếu tia cực tím cực tốt, bảo vệ quần thể khỏi bị cháy nắng dưới ánh mặt trời gay gắt.");
      newC.survival_method = appendText(c.survival_method, "Tự điều chỉnh góc độ của phao khí nghiêng sang trái hoặc sang phải (quần thể 'tay trái' và 'tay phải') để chia tách hướng trôi dạt của đàn sứa, giảm thiểu rủi ro toàn bầy cùng dạt vào bờ cát.");
      newC.unique_traits = appendText(c.unique_traits, "Gai độc nematocyst có ngòi đâm dài và mảnh có thể đâm xuyên qua lớp chitin của giáp xác biển nhỏ để tiêm trực tiếp độc lực vào hệ tuần hoàn.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế phóng gai châm nematocyst tạo áp lực lên tới 150 atmosphere, xuyên thủng lớp vảy mỏng của các loài cá nhỏ.");
      addUniqueItem(newC.strengths, "Khả năng co giãn xúc tu linh hoạt từ vài cm đến hơn 30 mét giúp quét sạch vùng không gian rộng lớn mà không tốn năng lượng di chuyển.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Rất nhạy cảm với sự sụt giảm độ mặn đột ngột khi trôi dạt vào các cửa sông nước ngọt lớn sau các cơn bão.");
      addUniqueItem(newC.weaknesses, "Không có cơ quan điều khiển trung ương hay não bộ để đưa ra quyết định chủ động chống lại mối đe dọa.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nọc độc sứa lửa chứa phức chất protein physalitoxin, có thể giữ nguyên hoạt tính sinh học ngay cả khi phơi khô dưới ánh nắng mặt trời nhiều giờ liền.");
      addUniqueItem(newC.fun_facts, "Bạch tuộc Blanket (Tremoctopus) được biết đến là loài miễn nhiễm với độc sứa lửa và thường giựt đứt xúc tu của sứa lửa làm vũ khí tự vệ.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1469-7998.1989.tb05027.x",
        label: "Journal of Zoology - Mechanics and hydrodynamics of the Portuguese man-of-war"
      });

    } else if (c.id === 'red-bellied-piranha') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["cá nhỏ", "côn trùng", "giáp xác", "giun sông", "xác động vật", "hạt thực vật"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, thụ tinh ngoài. Con cái đẻ khoảng 5.000 trứng dính vào rễ cây ngập nước. Cả cá bố và cá mẹ bảo vệ tổ cực kỳ hung dữ chống lại mọi kẻ xâm nhập cho đến khi trứng nở sau 9-10 ngày.';
      newC.locomotion = 'swim';
      newC.speed_max = 25.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 350.0;
      newC.weight_avg_g = 1200.0;

      newC.characteristics = appendText(c.characteristics, "Cơ liên sườn cực kỳ săn chắc cùng khớp đuôi dẹt đứng giúp tạo lực đẩy nước cực đại cho các pha bứt tốc tấn công đột ngột.");
      newC.survival_method = appendText(c.survival_method, "Thiết lập trật tự phân cấp trong bầy săn, những con lớn khỏe nhất chiếm vị trí cốt lõi bảo vệ lẫn nhau khỏi các đợt cắn đuôi nhầm lẫn khi hỗn chiến.");
      newC.unique_traits = appendText(c.unique_traits, "Răng cấu trúc xương ngà có mật độ khoáng chất canxi cao vượt trội giúp duy trì độ sắc bén chịu va đập cơ học chống mẻ khi gặm xương cứng.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lực cắn nén ép cơ học tương đương 320 Newton đột biến giúp bẻ gãy các gai xương cứng của con mồi chỉ trong chớp mắt.");
      addUniqueItem(newC.strengths, "Cơ chế mọc răng thay thế toàn bộ một bên hàm định kỳ để luôn duy trì độ sắc bén cao nhất.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Bị suy giảm khả năng định vị và phối hợp săn bầy rõ rệt khi hàm lượng oxy hòa tan trong nước hạ xuống mức cực thấp vào đỉnh điểm mùa khô.");
      addUniqueItem(newC.weaknesses, "Nhút nhát và dễ rơi vào trạng thái hoảng sợ tột độ khi bị cô lập khỏi bầy đàn.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng có thể phát ra các tần số âm thanh khác nhau bằng cách rung cơ bong bóng cá để cảnh báo đồng loại về mức độ nguy hiểm xung quanh.");
      addUniqueItem(newC.fun_facts, "Người dân bản địa lưu vực sông Amazon thường sử dụng răng của cá piranha bụng đỏ rụng tự nhiên để gắn vào các công cụ cắt gọt thủ công sắc bén.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/srep01009",
        label: "Scientific Reports - Extreme biting capabilities of piranhas"
      });

    } else if (c.id === 'red-lipped-batfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giáp xác nhỏ", "cua nhỏ", "giun biển", "cá con", "nhuyễn thể đáy"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Giao phối hữu tính, thụ tinh ngoài. Con cái phóng trứng trôi nổi (pelagic eggs) vào cột nước, trứng nở ra ấu trùng di chuyển tự do trong tầng nước mặt trước khi phát triển thành cá con chìm xuống đáy biển.';
      newC.locomotion = 'walk';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 250.0;
      newC.weight_avg_g = 300.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu túi nhớt trên da tiết dịch bôi trơn giảm ma sát cơ học khi lướt và di chuyển trên các rạn cát san hô lồi lõm.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng màu sắc sẫm ở vùng lưng để ngụy trang hòa nhập với các thảm đá trầm tích khi quan sát từ phía trên.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ ngực dẹt phẳng bám chắc vào đai vai vững chãi giúp nâng toàn bộ thân cá đứng vững thẳng góc trên đáy biển cát chảy.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ cấu đi bộ bằng bốn vây ngực và vây bụng chịu lực tốt bám trụ vững trên dòng hải lưu đáy mạnh.");
      addUniqueItem(newC.strengths, "Khả năng ngụy trang vật lý tiệp màu cát đáy biển tuyệt vời giúp lẩn tránh sự chú ý của các loài cá mập rạn san hô lớn.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Dễ bị tổn thương nghiêm trọng nếu cấu trúc cần câu sinh học illicium bị đứt hoặc bị ký sinh trùng ăn mòn.");
      addUniqueItem(newC.weaknesses, "Khả năng bơi cực kỳ kém ở tầng nước hở, hoàn toàn bất lợi nếu bị dòng nước cuốn trôi.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Để bù đắp khả năng bơi kém, cá dơi môi đỏ có bong bóng cá rất nhỏ nhằm duy trì độ nổi âm, giúp chúng luôn bám chặt dưới đáy cát biển.");
      addUniqueItem(newC.fun_facts, "Màu đỏ ở đôi môi căng mọng của chúng thực chất không chứa sắc tố mà được tạo nên bởi mật độ mao mạch máu cực kỳ đậm đặc bên dưới lớp biểu bì mỏng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.fishbase.se/summary/Ogcocephalus-darwini.html",
        label: "FishBase - Ogcocephalus darwini species profile"
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
